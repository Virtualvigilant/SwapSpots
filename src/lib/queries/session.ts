import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_FULL } from "./columns";
import type { Database } from "@/types/database";

export type CurrentProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  pickup_area: string | null;
  campus_id: string;
  role: Database["public"]["Enums"]["user_role"];
  verification_status: Database["public"]["Enums"]["verification_status"];
  verified_at: string | null;
  seller_rating_avg: number;
  seller_rating_count: number;
  buyer_rating_avg: number;
  buyer_rating_count: number;
  listings_sold_count: number;
  requests_fulfilled_count: number;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  created_at: string;
};

/**
 * The signed-in auth user, or null. `cache` dedupes it across a render — the
 * header, the page and a nested panel all ask, and it costs one call.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The signed-in user's profile row. Null when signed out, and also null in the
 * window between `auth.users` existing and onboarding completing — callers that
 * need a profile should send that case to /me/settings.
 */
export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const user = await getUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_FULL)
      .eq("id", user.id)
      .maybeSingle<CurrentProfile>();

    return data;
  },
);

export const isVerified = cache(async () => {
  const profile = await getCurrentProfile();
  return profile?.verification_status === "verified";
});

export const isStaff = cache(async () => {
  const profile = await getCurrentProfile();
  return profile?.role === "moderator" || profile?.role === "admin";
});
