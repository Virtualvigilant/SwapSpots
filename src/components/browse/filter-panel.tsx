import Link from "next/link";
import type { CategorySummary } from "@/lib/queries/categories";
import { conditionOptions, pickupAreas } from "@/lib/constants";
import { conditionLabels } from "@/lib/format";
import { buttonClasses } from "@/components/ui/button";

export type BrowseFilters = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  conditions: string[];
  verifiedOnly: boolean;
  pickup?: string;
  sort?: string;
  q?: string;
};

/**
 * Filters are a plain GET form, so every filtered view has a shareable URL and
 * works before JavaScript loads. On campus wifi that is not a nicety.
 */
export function FilterPanel({
  categories,
  total,
  filters,
  action = "/browse",
}: {
  categories: CategorySummary[];
  total: number;
  filters: BrowseFilters;
  action?: string;
}) {
  return (
    <aside className="space-y-6">
      <FilterGroup title="Category">
        <ul className="space-y-1">
          <li>
            <Link href="/browse" className={rowClass(!filters.category)}>
              <span>All categories</span>
              <span className="text-[11px] text-ink-400">{total}</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/browse/${c.slug}`}
                className={rowClass(filters.category === c.slug)}
              >
                <span className="truncate">{c.name}</span>
                <span className="text-[11px] text-ink-400">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <form action={action} className="space-y-6">
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

        <FilterGroup title="Price (KES)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="min"
              min={0}
              defaultValue={filters.minPrice}
              placeholder="Min"
              className="w-full rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
            />
            <span className="text-ink-400">–</span>
            <input
              type="number"
              name="max"
              min={0}
              defaultValue={filters.maxPrice}
              placeholder="Max"
              className="w-full rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Condition">
          <ul className="space-y-2">
            {conditionOptions.slice(0, 5).map((c) => (
              <li key={c}>
                <label className="flex items-center gap-2.5 text-[13px] text-ink-700">
                  <input
                    type="checkbox"
                    name="condition"
                    value={c}
                    defaultChecked={filters.conditions.includes(c)}
                    className="size-4 rounded border-line accent-[var(--color-brand)]"
                  />
                  {conditionLabels[c]}
                </label>
              </li>
            ))}
          </ul>
        </FilterGroup>

        <FilterGroup title="Pickup area">
          <select
            name="pickup"
            defaultValue={filters.pickup ?? ""}
            className="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] outline-none focus:border-brand"
          >
            <option value="">Anywhere on campus</option>
            {pickupAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Seller">
          <label className="flex items-center gap-2.5 text-[13px] text-ink-700">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={filters.verifiedOnly}
              className="size-4 rounded border-line accent-[var(--color-brand)]"
            />
            Verified students only
          </label>
        </FilterGroup>

        <div className="flex gap-2">
          <button type="submit" className={buttonClasses("dark", "sm", "flex-1")}>
            Apply
          </button>
          <Link
            href={action}
            className={buttonClasses("outline", "sm")}
          >
            Clear
          </Link>
        </div>
      </form>
    </aside>
  );
}

function rowClass(active: boolean) {
  return `flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
    active
      ? "bg-brand-50 font-semibold text-brand-700"
      : "text-ink-700 hover:bg-surface"
  }`;
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
        {title}
      </p>
      {children}
    </div>
  );
}
