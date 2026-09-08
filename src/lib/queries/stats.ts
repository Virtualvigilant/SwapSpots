import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Public counts for the landing page.
 *
 * Real numbers only. A hardcoded "5,000+ students" on a marketplace with
 * fourteen listings is the fastest way to lose the trust the whole product
 * depends on — so the hero shows what is actually there, and says nothing when
 * there is nothing to say.
 */
export const getPublicStats = cache(async () => {
  const supabase = await createClient();

  const [listings, requests, members, verified] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "reserved"]),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", false),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
  ]);

  return {
    listings: listings.count ?? 0,
    requests: requests.count ?? 0,
    members: members.count ?? 0,
    verified: verified.count ?? 0,
  };
});
