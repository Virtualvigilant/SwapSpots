import type { Metadata } from "next";
import Link from "next/link";
import { Radar } from "lucide-react";
import { getOthersWatch } from "@/lib/queries/admin";
import { SectionLead } from "@/components/ui/section-lead";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Others watch" };

export default async function OthersWatchPage() {
  const { listings, requests, share } = await getOthersWatch();
  const views = listings.reduce((n, l) => n + l.view_count, 0);

  return (
    <>
      <SectionLead
        title="Others watch"
        lead="Everything filed under the catch-all, sorted by views. Anything that keeps appearing here is a category you should promote — Others is a discovery mechanism for your own taxonomy, not a dumping ground."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Listings in Others" value={String(listings.length)} />
        <Stat label="Requests in Others" value={String(requests.length)} />
        <Stat label="Combined views" value={views.toLocaleString("en-KE")} />
        <Stat label="Share of catalogue" value={`${share.toFixed(1)}%`} />
      </div>

      {listings.length === 0 && requests.length === 0 ? (
        <EmptyState
          icon={<Radar className="size-5" />}
          title="Nothing in the catch-all"
          body="Good sign — it means the eight launch categories are covering what people actually post. Check back as volume grows."
        />
      ) : (
        <div className="space-y-4">
          {listings.length > 0 && (
            <Panel title="Listings" caption="Sorted by views">
              <ul className="divide-y divide-line border-t border-line">
                {listings.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-4 py-2.5 text-[13px]"
                  >
                    <Link
                      href={`/listings/${l.id}`}
                      className="truncate text-ink-700 hover:text-brand"
                    >
                      {l.title}
                    </Link>
                    <span className="shrink-0 text-[11.5px] text-ink-400">
                      {l.view_count.toLocaleString("en-KE")} views ·{" "}
                      {l.contact_count} contacts
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {requests.length > 0 && (
            <Panel title="Requests" caption="Sorted by views">
              <ul className="divide-y divide-line border-t border-line">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 py-2.5 text-[13px]"
                  >
                    <Link
                      href={`/requests/${r.id}`}
                      className="truncate text-ink-700 hover:text-brand"
                    >
                      {r.title}
                    </Link>
                    <span className="shrink-0 text-[11.5px] text-ink-400">
                      {r.view_count.toLocaleString("en-KE")} views · {r.bid_count}{" "}
                      bids
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand">
            <Radar className="size-4" />
          </span>
          <p className="text-[14px] font-bold text-ink">{title}</p>
        </div>
        <p className="text-[11.5px] text-ink-400">{caption}</p>
      </div>
      {children}
    </section>
  );
}
