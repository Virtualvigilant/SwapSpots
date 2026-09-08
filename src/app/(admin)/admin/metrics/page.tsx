import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { getMetrics } from "@/lib/queries/admin";
import { SectionLead } from "@/components/ui/section-lead";
import { Sparkline } from "@/components/ui/sparkline";

export const metadata: Metadata = { title: "Metrics" };

function duration(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default async function AdminMetricsPage() {
  const m = await getMetrics();

  const headline = [
    {
      label: "Contact events (7d)",
      value: m.contactsLast7.toLocaleString("en-KE"),
      delta: m.contactsDelta,
    },
    {
      label: "Contacts per active user",
      value: m.contactsPerActiveUser.toFixed(1),
      delta: null,
    },
    {
      label: "Requests bid within 6h",
      value: m.fillRate === null ? "—" : `${Math.round(m.fillRate)}%`,
      delta: null,
    },
    {
      label: "Median time to first bid",
      value: duration(m.medianTimeToFirstBid),
      delta: null,
    },
  ];

  const secondary = [
    { label: "Live listings", value: m.liveListings.toLocaleString("en-KE") },
    { label: "Open requests", value: m.openRequests.toLocaleString("en-KE") },
    { label: "Members", value: m.profiles.toLocaleString("en-KE") },
    { label: "Verified accounts", value: `${Math.round(m.verifiedShare)}%` },
    {
      label: "Reports per 1,000 listings",
      value: m.reportsPerThousand.toFixed(1),
    },
    {
      label: "Active contactors (7d)",
      value: m.activeContactors.toLocaleString("en-KE"),
    },
  ];

  return (
    <>
      <SectionLead
        title="Metrics"
        lead="Signups are the vanity metric. Contact events are the closest thing to a transaction we have — watch that, and watch how long a request waits for its first bid. Those two tell you whether the marketplace is alive."
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((h) => (
          <li key={h.label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-medium text-ink-500">{h.label}</p>
            <p className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.03em] text-ink">
              {h.value}
            </p>
            {h.delta !== null && h.delta !== undefined ? (
              <p
                className={`mt-1.5 flex items-center gap-1 text-[11.5px] font-bold ${
                  h.delta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                <TrendingUp
                  className={`size-3.5 ${h.delta >= 0 ? "" : "rotate-180"}`}
                />
                {h.delta >= 0 ? "+" : ""}
                {h.delta.toFixed(1)}% vs the week before
              </p>
            ) : (
              <p className="mt-1.5 text-[11.5px] text-ink-400">Last 30 days</p>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-[16px] font-bold text-ink">
            Contact events
          </h3>
          <p className="text-[11.5px] text-ink-400">Last 14 days</p>
        </div>
        <div className="mt-4">
          {m.series.some((n) => n > 0) ? (
            <Sparkline
              data={m.series}
              label="Contact events over the last 14 days"
            />
          ) : (
            <p className="py-8 text-center text-[13px] text-ink-400">
              No contact events yet. This is the number to watch first.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
          Health
        </h3>
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {secondary.map((s) => (
            <div key={s.label} className="bg-white px-5 py-4">
              <dt className="text-[11.5px] text-ink-500">{s.label}</dt>
              <dd className="mt-1 font-display text-[19px] font-extrabold tracking-[-0.03em] text-ink">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
