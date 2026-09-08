import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_FULL, PROFILE_CARD } from "./columns";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type PublicProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  pickup_area: string | null;
  verification_status: Enums["verification_status"];
  seller_rating_avg: number;
  seller_rating_count: number;
  buyer_rating_avg: number;
  buyer_rating_count: number;
  listings_sold_count: number;
  requests_fulfilled_count: number;
  created_at: string;
};

export const getProfileByUsername = cache(
  async (username: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_FULL)
      .eq("username", username.toLowerCase())
      .maybeSingle<PublicProfile>();
    return data;
  },
);

export type ReviewWithAuthor = {
  id: string;
  rating: number;
  comment: string | null;
  reviewed_role: Enums["reviewed_role"];
  context_type: Enums["review_context"];
  context_id: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
  } | null;
};

export async function getReviewsFor(
  userId: string,
  role?: Enums["reviewed_role"],
): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient();
  let q = supabase
    .from("reviews")
    .select(
      `id,rating,comment,reviewed_role,context_type,context_id,created_at,
       profiles!reviews_reviewer_id_fkey(username,full_name,avatar_url,verification_status)`,
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  if (role) q = q.eq("reviewed_role", role);

  const { data } = await q;
  return (data ?? []) as unknown as ReviewWithAuthor[];
}

/** Reviews the user has written — the other half of /me/reviews. */
export async function getReviewsBy(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `id,rating,comment,reviewed_role,context_type,context_id,created_at,
       profiles!reviews_reviewee_id_fkey(username,full_name,avatar_url,verification_status)`,
    )
    .eq("reviewer_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * The landing-page seller rail.
 *
 * Ordered by review count before average, because a 5.00 from one review is not
 * a better seller than a 4.7 from sixty — sorting on the average alone puts
 * noise at the top of the home page.
 */
export const getTopSellers = cache(async (limit = 3) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(`${PROFILE_CARD},bio,pickup_area,listings_sold_count`)
    .eq("is_suspended", false)
    .gt("seller_rating_count", 0)
    .order("seller_rating_count", { ascending: false })
    .order("seller_rating_avg", { ascending: false })
    .limit(limit);
  return data ?? [];
});

/** Contact events the user received — the responsiveness proxy from §5.4. */
export async function getContactStats(userId: string) {
  const supabase = await createClient();
  const [received, reviews] = await Promise.all([
    supabase
      .from("contact_events")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("reviewee_id", userId),
  ]);

  const contacts = received.count ?? 0;
  const earned = reviews.count ?? 0;
  return {
    contacts,
    reviews: earned,
    // Rough, and labelled as such in the UI. Without payments this is the only
    // responsiveness signal available (§5.4).
    responseRate: contacts === 0 ? null : Math.round((earned / contacts) * 100),
  };
}
