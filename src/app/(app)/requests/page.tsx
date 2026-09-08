import type { Metadata } from "next";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { searchRequests } from "@/lib/queries/requests";
import { getCategories } from "@/lib/queries/categories";
import { requestSorts } from "@/lib/constants";
import type { SearchParams } from "@/lib/search-params";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { RequestCard } from "@/components/requests/request-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ResultsBar } from "@/components/browse/results-bar";
import { Pagination } from "@/components/browse/pagination";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Request board",
  description:
    "Post what you need and let sellers bid for it. Award the bid you like — everyone else is told the moment it closes.",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const showClosed = params.status === "closed";

  const [categories, open, closed] = await Promise.all([
    getCategories(),
    searchRequests({ category, sort, page, openOnly: true }),
    searchRequests({ category, sort: "newest", perPage: 6, openOnly: false }),
  ]);

  // `openOnly: false` returns everything; the closed rail wants only the rest.
  const recentlyClosed = closed.items
    .filter((r) => r.status !== "open")
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Request board"
        lead="Say what you need and sellers come to you. Bids are open — everyone sees every amount, which is what keeps prices honest."
        crumbs={[{ label: "Requests" }]}
        action={
          <Link href="/requests/new" className={buttonClasses("primary", "md")}>
            Post a request
          </Link>
        }
      />

      <div className="container-page py-8">
        <ul className="no-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1">
          <li>
            <Link
              href="/requests"
              className={cn(
                "inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                category
                  ? "border border-line bg-white text-ink-700 hover:border-brand hover:text-brand"
                  : "bg-ink text-white",
              )}
            >
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/requests?category=${c.slug}`}
                className={cn(
                  "inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors",
                  category === c.slug
                    ? "bg-ink font-semibold text-white"
                    : "border border-line bg-white text-ink-700 hover:border-brand hover:text-brand",
                )}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>

        <section>
          <ResultsBar
            count={open.total}
            label="open requests"
            sorts={requestSorts}
          />

          {open.items.length === 0 ? (
            <EmptyState
              icon={<Gavel className="size-5" />}
              title="No open requests"
              body="Nobody is asking for anything right now. Be the first — it takes a minute, and sellers who follow the category get pinged immediately."
              actionLabel="Post a request"
              actionHref="/requests/new"
            />
          ) : (
            <ul className="grid gap-3.5 lg:grid-cols-2">
              {open.items.map((r) => (
                <li key={r.id}>
                  <RequestCard request={r} />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={open.page}
            perPage={open.perPage}
            total={open.total}
            searchParams={params}
            basePath="/requests"
          />
        </section>

        {recentlyClosed.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title mb-4 text-ink">Recently closed</h2>
            <ul className="grid gap-3.5 lg:grid-cols-2">
              {recentlyClosed.map((r) => (
                <li key={r.id}>
                  <RequestCard request={r} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {showClosed && recentlyClosed.length === 0 && (
          <p className="mt-10 text-[13px] text-ink-500">Nothing has closed yet.</p>
        )}
      </div>
    </>
  );
}
