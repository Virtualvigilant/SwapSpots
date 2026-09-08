import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { searchListings, getFavoriteIds } from "@/lib/queries/listings";
import { getCategories, getCategoryBySlug, getListingTotal } from "@/lib/queries/categories";
import { getUser } from "@/lib/queries/session";
import { parseBrowseParams, toFilterState, type SearchParams } from "@/lib/search-params";
import { listingSorts } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { FilterPanel } from "@/components/browse/filter-panel";
import { ResultsBar } from "@/components/browse/results-bar";
import { ListingGrid } from "@/components/browse/listing-grid";
import { Pagination } from "@/components/browse/pagination";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const found = await getCategoryBySlug(category);
  return found
    ? { title: found.name, description: found.blurb ?? undefined }
    : { title: "Category not found" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const query = await searchParams;
  const parsed = parseBrowseParams(query);

  const found = await getCategoryBySlug(category);
  if (!found) notFound();

  const [{ items, total, page, perPage }, categories, listingTotal, user] =
    await Promise.all([
      searchListings({ ...parsed, category: found.slug }),
      getCategories(),
      getListingTotal(),
      getUser(),
    ]);

  const savedIds = user ? await getFavoriteIds(user.id) : undefined;
  const visible = parsed.pickup
    ? items.filter((l) => l.pickup_area === parsed.pickup)
    : items;

  return (
    <>
      <PageHeader
        title={found.name}
        lead={found.blurb ?? undefined}
        crumbs={[{ label: "Browse", href: "/browse" }, { label: found.name }]}
        action={
          <Link href="/listings/new" className={buttonClasses("primary", "md")}>
            Post a listing
          </Link>
        }
      />

      {found.is_catchall && (
        <div className="container-page pt-6">
          <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-[12.5px] leading-relaxed text-brand-700">
            Others is a holding pen, not a home. We track what keeps landing here
            and promote it into a real category — if your item fits somewhere
            better, please move it.
          </p>
        </div>
      )}

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <FilterPanel
            categories={categories}
            total={listingTotal}
            filters={toFilterState(parsed, found.slug)}
            action={`/browse/${found.slug}`}
          />
        </div>
        <div>
          <ResultsBar
            count={total}
            label={`listings in ${found.name}`}
            sorts={listingSorts}
          />
          <ListingGrid
            listings={visible}
            savedIds={savedIds}
            signedIn={Boolean(user)}
            emptyTitle={`Nothing in ${found.name} yet`}
            emptyBody="Post a request in this category and sellers who follow it get pinged straight away."
          />
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            searchParams={query}
            basePath={`/browse/${found.slug}`}
          />
        </div>
      </div>
    </>
  );
}
