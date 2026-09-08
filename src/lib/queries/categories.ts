import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  icon: string | null;
  is_catchall: boolean;
  sort_order: number;
  /** Live count of listings currently visible in this category. */
  count: number;
};

/**
 * The category rail, with a real listing count per category.
 *
 * Two queries and a join in memory rather than a count per category: eight
 * round trips to render a nav rail is the kind of thing that only shows up
 * once the app is on a phone on campus wifi.
 */
export const getCategories = cache(async (): Promise<CategorySummary[]> => {
  const supabase = await createClient();

  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,slug,name,blurb,icon,is_catchall,sort_order")
      .eq("is_active", true)
      .is("parent_id", null)
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
});

export const getCategoryBySlug = cache(async (slug: string) => {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
});

/** Total live listings, for the "All categories" row on the filter rail. */
export const getListingTotal = cache(async () => {
  const all = await getCategories();
  return all.reduce((sum, c) => sum + c.count, 0);
});
