import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchListings, getFavoriteIds } from "@/lib/queries/listings";
import { searchRequests } from "@/lib/queries/requests";
import { getCategories } from "@/lib/queries/categories";
import { getUser } from "@/lib/queries/session";
import { PageHeader } from "@/components/ui/page-header";
import { ListingGrid } from "@/components/browse/listing-grid";
import { RequestCard } from "@/components/requests/request-card";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const categories = await getCategories();

  // §5.6: ranked Postgres FTS with a trigram fallback for short, typo'd terms.
  const [listingHits, requestHits, user] = query
    ? await Promise.all([
        searchListings({ query, sort: "relevance", perPage: 24 }),
        searchRequests({ query, sort: "relevance", perPage: 12, openOnly: true }),
        getUser(),
      ])
    : [null, null, await getUser()];

  const savedIds = user ? await getFavoriteIds(user.id) : undefined;
  const total = (listingHits?.total ?? 0) + (requestHits?.total ?? 0);

  return (
    <>
      <PageHeader
        title={query ? `Results for “${query}”` : "Search"}
        lead={
          query
            ? `${total} ${total === 1 ? "match" : "matches"} across listings and requests.`
            : "Search titles and descriptions across every live listing and open request."
        }
        crumbs={[{ label: "Search" }]}
      />

      <div className="container-page py-8">
        <form action="/search" className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="What are you looking for?"
              className="h-[50px] w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[14px] outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <button type="submit" className={buttonClasses("primary", "lg")}>
            Search
          </button>
        </form>

        {!query && (
          <div className="mt-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Start from a category
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/browse/${c.slug}`}
                    className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[12.5px] text-ink-700 transition-colors hover:border-brand hover:text-brand"
                  >
                    {c.name}
                    <span className="ml-1.5 text-[11px] text-ink-400">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-[60ch] text-[12.5px] leading-relaxed text-ink-500">
              Search covers titles and descriptions, weighted towards the title,
              and tolerates a typo or two on short terms. If nothing comes back,
              post a request instead — sellers who follow the category get told
              immediately.
            </p>
          </div>
        )}

        {query && listingHits && requestHits && (
          <div className="mt-8 space-y-10">
            <section>
              <h2 className="section-title mb-4 text-ink">
                Listings{" "}
                <span className="text-[14px] font-medium text-ink-400">
                  ({listingHits.total})
                </span>
              </h2>
              <ListingGrid
                listings={listingHits.items}
                savedIds={savedIds}
                signedIn={Boolean(user)}
                emptyTitle="No listings match that"
                emptyBody="Nothing on the catalogue matches. Post a request and let sellers come to you instead."
              />
            </section>

            {requestHits.items.length > 0 && (
              <section>
                <h2 className="section-title mb-4 text-ink">
                  Open requests{" "}
                  <span className="text-[14px] font-medium text-ink-400">
                    ({requestHits.total})
                  </span>
                </h2>
                <ul className="grid gap-3.5 lg:grid-cols-2">
                  {requestHits.items.map((r) => (
                    <li key={r.id}>
                      <RequestCard request={r} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
