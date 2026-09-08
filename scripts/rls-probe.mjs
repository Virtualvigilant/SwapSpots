/**
 * Anon-key RLS probe (§16).
 *
 * Assume every table is reachable directly with the anon key, because it is.
 * This script is that attacker: it tries the reads and writes that must fail,
 * and the handful that must succeed, and reports on both.
 *
 *   node scripts/rls-probe.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    let raw;
    try {
      raw = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match) env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);
const results = [];

/**
 * `expect: "deny"` means the call must be refused, or return nothing.
 *
 * An empty result is NOT treated as a pass for "allow" probes and NOT treated
 * as proof of a working policy for "deny" ones — on a new deployment every
 * table is empty, and a probe that reads that as "secure" would pass happily
 * right up until the first row is inserted. Only an actual error counts as
 * blocked; zero rows is reported separately as inconclusive.
 */
async function probe(name, expect, run) {
  let outcome;
  try {
    const { data, error } = await run();
    if (error) {
      outcome = { state: "denied", detail: error.message };
    } else {
      const rows = Array.isArray(data) ? data.length : data === null ? 0 : 1;
      outcome =
        rows === 0
          ? { state: "empty", detail: "permitted, but the table is empty" }
          : { state: "allowed", detail: `returned ${rows} row(s)` };
    }
  } catch (e) {
    outcome = { state: "denied", detail: e.message };
  }

  // A write that is permitted but affects nothing still means the grant is open.
  const pass =
    expect === "deny"
      ? outcome.state === "denied"
      : outcome.state !== "denied";

  results.push({
    name,
    expect,
    pass,
    inconclusive: outcome.state === "empty" && expect === "deny",
    detail: outcome.detail,
  });
}

const NIL = "00000000-0000-0000-0000-000000000000";

// --- must be readable by an anonymous visitor ------------------------------
await probe("read categories", "allow", () =>
  supabase.from("categories").select("id,slug,name").limit(1));
await probe("read campuses", "allow", () =>
  supabase.from("campuses").select("id,slug").limit(1));
await probe("read profiles_public", "allow", () =>
  supabase.from("profiles_public").select("id,username").limit(1));
await probe("call search_listings", "allow", () =>
  supabase.rpc("search_listings", { p_limit: 1 }));
await probe("call search_requests", "allow", () =>
  supabase.rpc("search_requests", { p_limit: 1 }));

// --- phone privacy (§5.3, §10) --------------------------------------------
// The positive half matters as much as the negative: if the column grant were
// wrong in the other direction, anon could not read a seller name at all and
// every browse page would be empty.
await probe("select the granted profile columns", "allow", () =>
  supabase
    .from("profiles")
    .select("id,username,full_name,avatar_url,verification_status")
    .limit(1));
await probe("select phone_e164 from profiles", "deny", () =>
  supabase.from("profiles").select("phone_e164").limit(1));
await probe("select * from profiles (expands to phone)", "deny", () =>
  supabase.from("profiles").select("*").limit(1));
await probe("select admission_hash from profiles", "deny", () =>
  supabase.from("profiles").select("admission_hash").limit(1));

// --- writes that must never work anonymously ------------------------------
await probe("insert a listing", "deny", () =>
  supabase.from("listings").insert({
    seller_id: NIL, campus_id: NIL, category_id: NIL,
    title: "rls probe", description: "should never be inserted", price: 1,
  }).select());
await probe("insert a request", "deny", () =>
  supabase.from("requests").insert({
    requester_id: NIL, campus_id: NIL, category_id: NIL,
    title: "rls probe", description: "should never be inserted",
  }).select());
await probe("insert a bid", "deny", () =>
  supabase.from("bids").insert({ request_id: NIL, bidder_id: NIL, amount: 1 }).select());
await probe("insert a contact_event", "deny", () =>
  supabase.from("contact_events").insert({
    initiator_id: NIL, recipient_id: NIL, target_type: "listing", target_id: NIL,
  }).select());
await probe("insert a notification", "deny", () =>
  supabase.from("notifications").insert({
    user_id: NIL, type: "probe", title: "probe",
  }).select());
await probe("insert a review", "deny", () =>
  supabase.from("reviews").insert({
    reviewer_id: NIL, reviewee_id: NIL, context_type: "listing",
    context_id: NIL, reviewed_role: "seller", rating: 5,
  }).select());
await probe("promote self to admin", "deny", () =>
  supabase.from("profiles").update({ role: "admin" }).neq("id", NIL).select());
await probe("insert a category", "deny", () =>
  supabase.from("categories").insert({ name: "probe", slug: "probe-rls" }).select());

// --- private tables --------------------------------------------------------
await probe("read contact_events", "deny", () =>
  supabase.from("contact_events").select("id").limit(1));
await probe("read notifications", "deny", () =>
  supabase.from("notifications").select("id").limit(1));
await probe("read reports", "deny", () =>
  supabase.from("reports").select("id").limit(1));
await probe("read verification_requests", "deny", () =>
  supabase.from("verification_requests").select("id").limit(1));
await probe("read moderation_keywords", "deny", () =>
  supabase.from("moderation_keywords").select("id").limit(1));
await probe("read moderation_flags", "deny", () =>
  supabase.from("moderation_flags").select("id").limit(1));
await probe("read strikes", "deny", () =>
  supabase.from("strikes").select("id").limit(1));

// --- privileged RPCs -------------------------------------------------------
await probe("call award_bid", "deny", () =>
  supabase.rpc("award_bid", { p_request_id: NIL, p_bid_id: NIL }));
await probe("call reveal_contact", "deny", () =>
  supabase.rpc("reveal_contact", { p_target_type: "listing", p_target_id: NIL }));
await probe("call resolve_report", "deny", () =>
  supabase.rpc("resolve_report", { p_report_id: NIL, p_status: "dismissed" }));
await probe("call expire_stale_records", "deny", () =>
  supabase.rpc("expire_stale_records"));
await probe("call purge_verification_artifacts", "deny", () =>
  supabase.rpc("purge_verification_artifacts"));
await probe("call complete_onboarding while signed out", "deny", () =>
  supabase.rpc("complete_onboarding", {
    p_username: "probe_user", p_full_name: "Probe", p_phone_e164: "+254712345678",
  }));

// --- report ----------------------------------------------------------------
const failed = results.filter((r) => !r.pass);
const unproven = results.filter((r) => r.inconclusive);
const width = Math.max(...results.map((r) => r.name.length));

console.log(`\nRLS probe against ${url}\n`);
for (const r of results) {
  const mark = !r.pass ? " FAIL " : r.inconclusive ? " ~~~~ " : "  ok  ";
  console.log(
    `${mark} ${r.name.padEnd(width)}  ${r.expect.padEnd(5)}  ${r.detail}`,
  );
}

console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (unproven.length) {
  console.log(
    `${unproven.length} inconclusive (~~~~): the grant was refused for another ` +
      `reason, or the table is empty. Re-run once there is real data.`,
  );
}
if (failed.length) console.log(`${failed.length} FAILED`);
console.log();

process.exit(failed.length ? 1 : 0);
