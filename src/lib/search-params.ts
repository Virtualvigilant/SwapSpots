import type { Database } from "@/types/database";
import { conditionOptions } from "@/lib/constants";
import type { BrowseFilters } from "@/components/browse/filter-panel";

export type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

function many(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Reads the browse/search query string into the shape both the RPC and the
 * filter rail want. Anything unparseable is dropped rather than erroring — a
 * hand-edited URL should degrade to an unfiltered page, not a 500.
 */
export function parseBrowseParams(params: SearchParams) {
  const conditions = many(params.condition).filter(
    (c): c is Database["public"]["Enums"]["item_condition"] =>
      (conditionOptions as string[]).includes(c),
  );

  const page = Math.max(1, Number(one(params.page) ?? 1) || 1);

  return {
    query: one(params.q),
    minPrice: positiveInt(one(params.min)),
    maxPrice: positiveInt(one(params.max)),
    conditions,
    pickup: one(params.pickup),
    verifiedOnly: one(params.verified) === "1",
    sort: one(params.sort),
    page,
  };
}

export function toFilterState(
  parsed: ReturnType<typeof parseBrowseParams>,
  category?: string,
): BrowseFilters {
  return {
    category,
    minPrice: parsed.minPrice?.toString(),
    maxPrice: parsed.maxPrice?.toString(),
    conditions: parsed.conditions,
    verifiedOnly: parsed.verifiedOnly,
    pickup: parsed.pickup,
    sort: parsed.sort,
    q: parsed.query,
  };
}
