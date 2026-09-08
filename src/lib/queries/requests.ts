import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { CAMPUS_SLUG } from "@/lib/constants";
import { PROFILE_CARD } from "./columns";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

/** One card on the request board. Mirrors the `search_requests` row shape. */
export type RequestCardData = {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  needed_by: string | null;
  status: Enums["request_status"];
  bid_count: number;
  view_count: number;
  expires_at: string;
  created_at: string;
  category_slug: string;
  category_name: string;
  requester_id: string;
  requester_username: string;
  requester_name: string;
  requester_avatar_url: string | null;
  requester_verified: boolean;
  lowest_bid: number | null;
};

export type RequestSearchParams = {
  query?: string;
  category?: string;
  openOnly?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
};

export async function searchRequests(params: RequestSearchParams = {}) {
  const supabase = await createClient();
  const perPage = params.perPage ?? 24;
  const page = Math.max(1, params.page ?? 1);

  const { data, error } = await supabase.rpc("search_requests", {
    p_query: params.query || undefined,
    p_category_slug: params.category || undefined,
    p_campus_slug: CAMPUS_SLUG,
    p_open_only: params.openOnly ?? true,
    p_sort: params.sort ?? (params.query ? "relevance" : "newest"),
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
  });

  if (error) throw error;

  const rows = (data ?? []) as unknown as (RequestCardData & {
    total_count: number;
  })[];

  return { items: rows, total: rows[0]?.total_count ?? 0, page, perPage };
}

export type BidWithBidder = {
  id: string;
  request_id: string;
  bidder_id: string;
  amount: number;
  message: string | null;
  availability: string | null;
  listing_id: string | null;
  status: Enums["bid_status"];
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
    seller_rating_avg: number;
    seller_rating_count: number;
  } | null;
};

export type RequestDetail = {
  id: string;
  requester_id: string;
  category_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  needed_by: string | null;
  status: Enums["request_status"];
  awarded_bid_id: string | null;
  bid_count: number;
  view_count: number;
  expires_at: string;
  awarded_at: string | null;
  closed_at: string | null;
  created_at: string;
  categories: { slug: string; name: string } | null;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
    buyer_rating_avg: number;
    buyer_rating_count: number;
  } | null;
  bids: BidWithBidder[];
};

/**
 * Request detail with its full bid list.
 *
 * Bids are public by design (§5.2) — amount and bidder identity both. Blind
 * bidding removes the competitive pressure that makes the request board worth
 * using at all, so the query does not try to hide anything.
 */
export const getRequest = cache(
  async (id: string): Promise<RequestDetail | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("requests")
      .select(
        `id,requester_id,category_id,title,description,budget_min,budget_max,needed_by,
         status,awarded_bid_id,bid_count,view_count,expires_at,awarded_at,closed_at,created_at,
         categories(slug,name),
         profiles!requests_requester_id_fkey(${PROFILE_CARD}),
         bids(
           id,request_id,bidder_id,amount,message,availability,listing_id,status,created_at,
           profiles!bids_bidder_id_fkey(${PROFILE_CARD})
         )`,
      )
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    const request = data as unknown as RequestDetail;
    // Lowest first: the requester is comparing prices, not reading a feed.
    request.bids = [...(request.bids ?? [])]
      .filter((b) => b.status !== "withdrawn")
      .sort((a, b) => a.amount - b.amount);
    return request;
  },
);

export async function getMyRequests(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select(
      `id,title,description,budget_min,budget_max,needed_by,status,bid_count,view_count,
       expires_at,awarded_at,created_at,
       categories(slug,name)`,
    )
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/** Every bid the user has placed, with the request it sits on. */
export async function getMyBids(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bids")
    .select(
      `id,amount,message,availability,status,created_at,request_id,
       requests(
         id,title,status,expires_at,bid_count,awarded_bid_id,
         categories(slug,name),
         profiles!requests_requester_id_fkey(username,full_name,avatar_url,verification_status)
       )`,
    )
    .eq("bidder_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/** Does the caller already have a bid on this request? Drives the form state. */
export async function getMyBidOn(requestId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bids")
    .select("id,amount,message,availability,status")
    .eq("request_id", requestId)
    .eq("bidder_id", userId)
    .maybeSingle();
  return data;
}
