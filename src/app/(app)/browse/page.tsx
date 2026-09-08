import type { Metadata } from "next";
import Link from "next/link";
import { searchListings } from "@/lib/queries/listings";
import { getCategories, getListingTotal } from "@/lib/queries/categories";
import { getUser } from "@/lib/queries/session";
import { getFavoriteIds } from "@/lib/queries/listings";
import { parseBrowseParams, toFilterState, type SearchParams } from "@/lib/search-params";
import { listingSorts } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { FilterPanel } from "@/components/browse/filter-panel";
import { ResultsBar } from "@/components/browse/results-bar";
import { ListingGrid } from "@/components/browse/listing-grid";
import { Pagination } from "@/components/browse/pagination";

export const metadata: Metadata = {
  title: "Browse listings",
  description: "Everything currently for sale on campus, from verified students.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsed = parseBrowseParams(params);

  const [{ items, total, page, perPage }, categories, listingTotal, user] =
    await Promise.all([
      searchListings(parsed),
      getCategories(),
      getListingTotal(),
      getUser(),
    ]);

  const savedIds = user ? await getFavoriteIds(user.id) : undefined;

  // Pickup area is not a column the search RPC filters on, so it narrows here.
  const visible = parsed.pickup
    ? items.filter((l) => l.pickup_area === parsed.pickup)
    : items;

  return (
    <>
      <PageHeader
        title="Browse listings"
        lead="Everything currently for sale on campus. Listings expire after 30 days, so what you see here is live."
        crumbs={[{ label: "Browse" }]}
        action={
          <Link href="/listings/new" className={buttonClasses("primary", "md")}>
            Post a listing
          </Link>
        }
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <FilterPanel
            categories={categories}
            total={listingTotal}
            filters={toFilterState(parsed)}
          />
        </div>
        <div>
          <ResultsBar count={total} label="listings" sorts={listingSorts} />
          <ListingGrid
            listings={visible}
            savedIds={savedIds}
            signedIn={Boolean(user)}
            emptyTitle={
              listingTotal === 0 ? "No listings yet" : "Nothing matches that"
            }
            emptyBody={
              listingTotal === 0
                ? "Be the first to post something. A catalogue with one real item beats an empty one."
                : "No live listings match this filter. Post a request instead and let sellers come to you."
            }
          />
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            searchParams={params}
            basePath="/browse"
          />
        </div>
      </div>
    </>
  );
}
