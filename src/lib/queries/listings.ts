import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { CAMPUS_SLUG } from "@/lib/constants";
import { PROFILE_CARD } from "./columns";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

/** One card in a grid or a rail. Mirrors the `search_listings` row shape. */
export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  price_type: Enums["price_type"];
  condition: Enums["item_condition"];
  status: Enums["listing_status"];
  pickup_area: string | null;
  created_at: string;
  category_slug: string;
  category_name: string;
  seller_id: string;
  seller_username: string;
  seller_name: string;
  seller_avatar_url: string | null;
  seller_verified: boolean;
  seller_rating_avg: number;
  seller_rating_count: number;
  image_path: string | null;
  view_count: number;
  favorite_count: number;
};

export type ListingSearchParams = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  conditions?: Enums["item_condition"][];
  verifiedOnly?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
};

export type ListingSearchResult = {
  items: ListingCardData[];
  total: number;
  page: number;
  perPage: number;
};

/**
 * §5.6 search. Ranked Postgres FTS with `pg_trgm` fallback, filters and paging
 * all done in one `search_listings` call — the alternative is fetching rows and
 * filtering in Node, which stops working the moment the catalogue is real.
 */
export async function searchListings(
  params: ListingSearchParams = {},
): Promise<ListingSearchResult> {
  const supabase = await createClient();
  const perPage = params.perPage ?? 24;
  const page = Math.max(1, params.page ?? 1);

  const { data, error } = await supabase.rpc("search_listings", {
    p_query: params.query || undefined,
    p_category_slug: params.category || undefined,
    p_campus_slug: CAMPUS_SLUG,
    p_min_price: params.minPrice,
    p_max_price: params.maxPrice,
    p_conditions: params.conditions?.length ? params.conditions : undefined,
    p_verified_only: params.verifiedOnly ?? false,
    p_sort: params.sort ?? (params.query ? "relevance" : "newest"),
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
  });

  if (error) throw error;

  const rows = (data ?? []) as unknown as (ListingCardData & {
    total_count: number;
  })[];

  return {
    items: rows,
    total: rows[0]?.total_count ?? 0,
    page,
    perPage,
  };
}

export type ListingDetail = {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  price_type: Enums["price_type"];
  condition: Enums["item_condition"];
  pickup_area: string | null;
  status: Enums["listing_status"];
  view_count: number;
  contact_count: number;
  favorite_count: number;
  expires_at: string;
  created_at: string;
  categories: { slug: string; name: string } | null;
  listing_images: {
    id: string;
    storage_path: string;
    position: number;
    blurhash: string | null;
  }[];
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
    seller_rating_avg: number;
    seller_rating_count: number;
    buyer_rating_avg: number;
    buyer_rating_count: number;
  } | null;
};

export const getListing = cache(
  async (id: string): Promise<ListingDetail | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("listings")
      .select(
        `id,seller_id,category_id,title,description,price,price_type,condition,
         pickup_area,status,view_count,contact_count,favorite_count,expires_at,created_at,
         categories(slug,name),
         listing_images(id,storage_path,position,blurhash),
         profiles!listings_seller_id_fkey(${PROFILE_CARD})`,
      )
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    const listing = data as unknown as ListingDetail;
    listing.listing_images = [...(listing.listing_images ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    return listing;
  },
);

/** The landing rail. Newest live listings, nothing clever. */
export async function getNewArrivals(limit = 6): Promise<ListingCardData[]> {
  const { items } = await searchListings({ perPage: limit, sort: "newest" });
  return items;
}

/** §5.4: the "most contacted" rail is a real signal, unlike a view count. */
export async function getMostContacted(limit = 3): Promise<ListingCardData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      `id,title,price,price_type,condition,status,pickup_area,created_at,view_count,
       favorite_count,contact_count,
       categories(slug,name),
       listing_images(storage_path,position),
       profiles!listings_seller_id_fkey(${PROFILE_CARD})`,
    )
    .in("status", ["active", "reserved"])
    .order("contact_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(flattenListingRow);
}

export async function getListingsBySeller(
  sellerId: string,
): Promise<ListingCardData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      `id,title,price,price_type,condition,status,pickup_area,created_at,view_count,
       favorite_count,
       categories(slug,name),
       listing_images(storage_path,position),
       profiles!listings_seller_id_fkey(${PROFILE_CARD})`,
    )
    .eq("seller_id", sellerId)
    .in("status", ["active", "reserved"])
    .order("created_at", { ascending: false });

  return (data ?? []).map(flattenListingRow);
}

/** Every listing the caller owns, in any status — RLS shows them their own. */
export async function getMyListings(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      `id,title,price,price_type,condition,status,pickup_area,created_at,expires_at,
       view_count,favorite_count,contact_count,
       categories(slug,name),
       listing_images(storage_path,position)`,
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    image_path: primaryImage(row.listing_images),
  }));
}

export async function getFavorites(userId: string): Promise<ListingCardData[]> {
  const supabase = await createClient();

  // Two queries rather than one nested embed: PostgREST can express the join,
  // but `favorites -> listings -> profiles` is deep enough that the select
  // string stops being readable, and the ordering we want is on `favorites`.
  const { data: rows } = await supabase
    .from("favorites")
    .select("listing_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => r.listing_id);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("listings")
    .select(
      `id,title,price,price_type,condition,status,pickup_area,created_at,view_count,
       favorite_count,
       categories(slug,name),
       listing_images(storage_path,position),
       profiles!listings_seller_id_fkey(${PROFILE_CARD})`,
    )
    .in("id", ids);

  const bySavedOrder = new Map(ids.map((id, i) => [id, i]));
  return (data ?? [])
    .map(flattenListingRow)
    .sort(
      (a, b) =>
        (bySavedOrder.get(a.id) ?? 0) - (bySavedOrder.get(b.id) ?? 0),
    );
}

export const getFavoriteIds = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((f) => f.listing_id));
});

// ---------------------------------------------------------------------------

type RawListingRow = {
  id: string;
  title: string;
  price: number;
  price_type: Enums["price_type"];
  condition: Enums["item_condition"];
  status: Enums["listing_status"];
  pickup_area: string | null;
  created_at: string;
  view_count: number;
  favorite_count: number;
  categories: { slug: string; name: string } | null;
  listing_images: { storage_path: string; position: number }[] | null;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    verification_status: Enums["verification_status"];
    seller_rating_avg: number;
    seller_rating_count: number;
  } | null;
};

function primaryImage(
  images: { storage_path: string; position: number }[] | null | undefined,
): string | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => a.position - b.position)[0].storage_path;
}

/** Collapses an embedded PostgREST row into the flat card shape. */
function flattenListingRow(row: unknown): ListingCardData {
  const r = row as RawListingRow;
  return {
    id: r.id,
    title: r.title,
    price: r.price,
    price_type: r.price_type,
    condition: r.condition,
    status: r.status,
    pickup_area: r.pickup_area,
    created_at: r.created_at,
    category_slug: r.categories?.slug ?? "others",
    category_name: r.categories?.name ?? "Others",
    seller_id: r.profiles?.id ?? "",
    seller_username: r.profiles?.username ?? "",
    seller_name: r.profiles?.full_name ?? "",
    seller_avatar_url: r.profiles?.avatar_url ?? null,
    seller_verified: r.profiles?.verification_status === "verified",
    seller_rating_avg: r.profiles?.seller_rating_avg ?? 0,
    seller_rating_count: r.profiles?.seller_rating_count ?? 0,
    image_path: primaryImage(r.listing_images),
    view_count: r.view_count,
    favorite_count: r.favorite_count,
  };
}
