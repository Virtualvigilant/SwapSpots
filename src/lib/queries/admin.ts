import { createClient } from "@/lib/supabase/server";
import { PROFILE_CARD } from "./columns";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type ReportRow = {
  id: string;
  target_type: Enums["report_target"];
  target_id: string;
  reason: string;
  details: string | null;
  status: Enums["report_status"];
  created_at: string;
  moderator_notes: string | null;
  reporter: { username: string; full_name: string } | null;
  /** Resolved separately — the target is polymorphic, so it cannot be joined. */
  targetLabel: string;
  targetHref: string;
  ownerUsername: string | null;
  strikes: number;
};

/**
 * The moderation queue.
 *
 * `reports.target_id` is polymorphic, so the label and the owner cannot come
 * from a join — they are resolved in a second pass, batched per target type
 * rather than per row.
 */
export async function getReports(): Promise<ReportRow[]> {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      `id,target_type,target_id,reason,details,status,created_at,moderator_notes,
       reporter:profiles!reports_reporter_id_fkey(username,full_name)`,
    )
    .order("status")
    .order("created_at", { ascending: false });

  if (!reports?.length) return [];

  const idsBy = (t: Enums["report_target"]) =>
    reports.filter((r) => r.target_type === t).map((r) => r.target_id);

  const [listings, requests, bids, profiles, reviews] = await Promise.all([
    fetchIn(supabase, "listings", "id,title,seller_id", idsBy("listing")),
    fetchIn(supabase, "requests", "id,title,requester_id", idsBy("request")),
    fetchIn(supabase, "bids", "id,request_id,bidder_id,amount", idsBy("bid")),
    fetchIn(supabase, "profiles", `id,username,full_name`, idsBy("profile")),
    fetchIn(supabase, "reviews", "id,reviewer_id,comment", idsBy("review")),
  ]);

  const owners = new Set<string>();
  const resolve = (r: (typeof reports)[number]) => {
    switch (r.target_type) {
      case "listing": {
        const l = listings.get(r.target_id) as
          | { title: string; seller_id: string }
          | undefined;
        return {
          label: l?.title ?? "Deleted listing",
          href: `/listings/${r.target_id}`,
          owner: l?.seller_id ?? null,
        };
      }
      case "request": {
        const q = requests.get(r.target_id) as
          | { title: string; requester_id: string }
          | undefined;
        return {
          label: q?.title ?? "Deleted request",
          href: `/requests/${r.target_id}`,
          owner: q?.requester_id ?? null,
        };
      }
      case "bid": {
        const b = bids.get(r.target_id) as
          | { request_id: string; bidder_id: string; amount: number }
          | undefined;
        return {
          label: b ? `Bid of KES ${b.amount}` : "Deleted bid",
          href: b ? `/requests/${b.request_id}` : "/admin/reports",
          owner: b?.bidder_id ?? null,
        };
      }
      case "profile": {
        const p = profiles.get(r.target_id) as
          | { username: string; full_name: string }
          | undefined;
        return {
          label: p ? `@${p.username}` : "Deleted profile",
          href: p ? `/u/${p.username}` : "/admin/reports",
          owner: r.target_id,
        };
      }
      case "review": {
        const v = reviews.get(r.target_id) as
          | { reviewer_id: string; comment: string | null }
          | undefined;
        return {
          label: v?.comment ? `Review: "${v.comment.slice(0, 60)}"` : "Review",
          href: "/admin/reports",
          owner: v?.reviewer_id ?? null,
        };
      }
    }
  };

  const resolved = reports.map((r) => {
    const t = resolve(r);
    if (t.owner) owners.add(t.owner);
    return { report: r, target: t };
  });

  // Strike counts and usernames for every owner in the queue, in one round trip.
  const ownerIds = [...owners];
  const [ownerRows, strikeRows] = await Promise.all([
    fetchIn(supabase, "profiles", "id,username", ownerIds),
    ownerIds.length
      ? supabase
          .from("strikes")
          .select("user_id")
          .in("user_id", ownerIds)
          .gt(
            "created_at",
            new Date(Date.now() - 90 * 86_400_000).toISOString(),
          )
      : Promise.resolve({ data: [] as { user_id: string }[] }),
  ]);

  const strikeTally = new Map<string, number>();
  for (const s of strikeRows.data ?? []) {
    strikeTally.set(s.user_id, (strikeTally.get(s.user_id) ?? 0) + 1);
  }

  return resolved.map(({ report, target }) => ({
    ...report,
    reporter: report.reporter as ReportRow["reporter"],
    targetLabel: target.label,
    targetHref: target.href,
    ownerUsername: target.owner
      ? ((ownerRows.get(target.owner) as { username: string } | undefined)
          ?.username ?? null)
      : null,
    strikes: target.owner ? (strikeTally.get(target.owner) ?? 0) : 0,
  }));
}

export type VerificationRow = {
  id: string;
  user_id: string;
  id_image_path: string;
  status: Enums["verification_status"];
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  purge_after: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
  } | null;
};

export async function getVerifications(): Promise<VerificationRow[]> {
  const supabase = await createClient();
  // The interpolated column list defeats PostgREST's select-string inference,
  // so the row shape is declared above rather than derived.
  const { data } = await supabase
    .from("verification_requests")
    .select(
      `id,user_id,id_image_path,status,created_at,reviewed_at,rejection_reason,purge_after,
       profiles!verification_requests_user_id_fkey(${PROFILE_CARD})`,
    )
    .order("status")
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as VerificationRow[];
}

/**
 * §5.5 Others watch. Catch-all items sorted by views — anything that keeps
 * appearing is a category to promote, which is the whole point of keeping a
 * catch-all rather than forcing people to mis-file.
 */
export async function getOthersWatch() {
  const supabase = await createClient();

  const { data: catchall } = await supabase
    .from("categories")
    .select("id,name")
    .eq("is_catchall", true)
    .maybeSingle();

  if (!catchall) return { listings: [], requests: [], share: 0 };

  const [{ data: listings }, { data: requests }, totals] = await Promise.all([
    supabase
      .from("listings")
      .select("id,title,view_count,contact_count,created_at,status")
      .eq("category_id", catchall.id)
      .in("status", ["active", "reserved"])
      .order("view_count", { ascending: false })
      .limit(50),
    supabase
      .from("requests")
      .select("id,title,view_count,bid_count,created_at,status")
      .eq("category_id", catchall.id)
      .order("view_count", { ascending: false })
      .limit(50),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "reserved"]),
  ]);

  const total = totals.count ?? 0;
  return {
    listings: listings ?? [],
    requests: requests ?? [],
    share: total ? ((listings?.length ?? 0) / total) * 100 : 0,
  };
}

export async function getAdminCategories() {
  const supabase = await createClient();
  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,slug,name,blurb,icon,is_catchall,is_active,sort_order")
      .order("sort_order"),
    supabase
      .from("listings")
      .select("category_id")
      .in("status", ["active", "reserved"]),
  ]);

  const tally = new Map<string, number>();
  for (const row of counts ?? []) {
    tally.set(row.category_id, (tally.get(row.category_id) ?? 0) + 1);
  }
  return (categories ?? []).map((c) => ({ ...c, count: tally.get(c.id) ?? 0 }));
}

/**
 * §13 metrics. Signups are the vanity metric — what matters is contact events
 * (the GMV stand-in in a discovery model) and how long a request waits for its
 * first bid.
 */
export async function getMetrics() {
  const supabase = await createClient();
  const now = Date.now();
  const since = (days: number) =>
    new Date(now - days * 86_400_000).toISOString();

  const [
    contacts14,
    contactsPrev7,
    liveListings,
    openRequests,
    profileCount,
    verifiedCount,
    reportCount,
    recentRequests,
  ] = await Promise.all([
    supabase
      .from("contact_events")
      .select("created_at,initiator_id")
      .gte("created_at", since(14)),
    supabase
      .from("contact_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since(14))
      .lt("created_at", since(7)),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "reserved"]),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase
      .from("requests")
      .select("id,created_at,bids(created_at)")
      .gte("created_at", since(30)),
  ]);

  // Daily buckets for the sparkline, oldest first.
  const series = Array.from({ length: 14 }, () => 0);
  const actors = new Set<string>();
  for (const e of contacts14.data ?? []) {
    const age = Math.floor((now - new Date(e.created_at).getTime()) / 86_400_000);
    if (age >= 0 && age < 14) series[13 - age] += 1;
    if (age < 7) actors.add(e.initiator_id);
  }
  const last7 = series.slice(7).reduce((a, b) => a + b, 0);
  const prev7 = contactsPrev7.count ?? 0;

  // §13: fill rate is a bid within six hours, not a bid eventually.
  const requests = recentRequests.data ?? [];
  let filledFast = 0;
  const firstBidWaits: number[] = [];
  for (const r of requests) {
    const bids = (r.bids ?? []) as { created_at: string }[];
    if (!bids.length) continue;
    const first = Math.min(...bids.map((b) => new Date(b.created_at).getTime()));
    const wait = first - new Date(r.created_at).getTime();
    firstBidWaits.push(wait);
    if (wait <= 6 * 3_600_000) filledFast += 1;
  }
  firstBidWaits.sort((a, b) => a - b);
  const medianWait = firstBidWaits.length
    ? firstBidWaits[Math.floor(firstBidWaits.length / 2)]
    : null;

  const listings = liveListings.count ?? 0;
  const profiles = profileCount.count ?? 0;

  return {
    contactsLast7: last7,
    contactsDelta: prev7 === 0 ? null : ((last7 - prev7) / prev7) * 100,
    contactsPerActiveUser: actors.size ? last7 / actors.size : 0,
    activeContactors: actors.size,
    series,
    fillRate: requests.length ? (filledFast / requests.length) * 100 : null,
    medianTimeToFirstBid: medianWait,
    liveListings: listings,
    openRequests: openRequests.count ?? 0,
    profiles,
    verifiedShare: profiles ? ((verifiedCount.count ?? 0) / profiles) * 100 : 0,
    reportsPerThousand: listings ? ((reportCount.count ?? 0) / listings) * 1000 : 0,
  };
}

// ---------------------------------------------------------------------------

/** `select … in (…)` for a set of ids, returned as a lookup keyed by id. */
async function fetchIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "listings" | "requests" | "bids" | "profiles" | "reviews",
  columns: string,
  ids: string[],
) {
  const map = new Map<string, Record<string, unknown>>();
  if (!ids.length) return map;

  const { data } = await supabase
    .from(table)
    .select(columns)
    .in("id", [...new Set(ids)]);

  for (const row of (data ?? []) as unknown as { id: string }[]) {
    map.set(row.id, row as Record<string, unknown>);
  }
  return map;
}
