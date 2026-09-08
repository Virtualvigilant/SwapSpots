import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Gavel, Tag } from "lucide-react";
import { redirect } from "next/navigation";
import { getMyRequests } from "@/lib/queries/requests";
import { getCurrentProfile } from "@/lib/queries/session";
import { kes, hoursUntil, timeAgo } from "@/lib/format";
import { SectionLead } from "@/components/ui/section-lead";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "My requests" };

export default async function MyRequestsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/me/settings");

  const mine = await getMyRequests(profile.id);
  const open = mine.filter((r) => r.status === "open");
  const closed = mine.filter((r) => r.status !== "open");
  const bidsIn = mine.reduce((n, r) => n + r.bid_count, 0);

  return (
    <>
      <SectionLead
        title="My requests"
        lead={`${open.length} open, ${bidsIn} ${bidsIn === 1 ? "bid" : "bids"} received. Award before the timer runs out or the request closes on its own.`}
        action={
          <Link href="/requests/new" className={buttonClasses("primary", "sm")}>
            Post a request
          </Link>
        }
      />

      {mine.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-5" />}
          title="No requests yet"
          body="Say what you need and sellers bid for it. Sellers who follow the category are notified the moment it goes up."
          actionLabel="Post a request"
          actionHref="/requests/new"
        />
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <Section title="Open" requests={open} />
          )}
          {closed.length > 0 && (
            <Section title="Closed" requests={closed} />
          )}
        </div>
      )}
    </>
  );
}

type Row = Awaited<ReturnType<typeof getMyRequests>>[number];

function Section({ title, requests }: { title: string; requests: Row[] }) {
  return (
    <section>
      <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
        {title}
      </h3>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusBadge status={r.status} />
                  {r.categories && <Badge tone="muted">{r.categories.name}</Badge>}
                </div>
                <Link
                  href={`/requests/${r.id}`}
                  className="mt-2 block text-[14px] font-bold text-ink hover:text-brand"
                >
                  {r.title}
                </Link>
                <p className="mt-1 text-[11.5px] text-ink-400">
                  Posted {timeAgo(r.created_at)}
                  {r.budget_min !== null && r.budget_max !== null && (
                    <> · {kes(r.budget_min)} – {kes(r.budget_max)}</>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  href={`/requests/${r.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-brand"
                >
                  <Gavel className="size-3.5" />
                  {r.bid_count} {r.bid_count === 1 ? "bid" : "bids"}
                </Link>
                {r.status === "open" && (
                  <span className="flex items-center gap-1 text-[11.5px] font-semibold text-brand">
                    <Clock className="size-3.5" />
                    {hoursUntil(r.expires_at)}h left
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
