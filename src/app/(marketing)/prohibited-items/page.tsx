import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Flag, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Prohibited items",
  description: "What cannot be listed or requested on SwapSpot, and what happens if you try.",
};

const BANNED = [
  {
    title: "Academic dishonesty",
    body: "Assignment writing, ghostwriting, exam papers, proxy attendance, sitting a CAT for someone. This is the most common violation and the most socially normalised one. We remove it anyway.",
  },
  {
    title: "Alcohol, tobacco, vapes and controlled substances",
    body: "Including nicotine pouches and anything sold as a “herbal” substitute.",
  },
  {
    title: "Prescription medication",
    body: "Any drug that legally requires a prescription, including antibiotics and stimulants.",
  },
  { title: "Weapons", body: "Knives sold as weapons, tasers, pepper spray, replicas and airsoft." },
  { title: "Adult or sexual services", body: "Including anything advertised euphemistically." },
  {
    title: "Anything needing a licence you do not hold",
    body: "Medical, legal or financial advice, driving instruction, food sold at scale without a permit.",
  },
  {
    title: "Financial services",
    body: "Lending, “investment opportunities”, forex signals, crypto schemes, referral pyramids.",
  },
];

export default function ProhibitedItemsPage() {
  return (
    <>
      <PageHeader
        title="Prohibited items"
        lead="A campus request board fills with these within a week of launch. We assume it, and we enforce the same way every time — inconsistent enforcement is worse than none, because it also destroys the credibility of the ratings system."
        crumbs={[{ label: "Prohibited items" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <ul className="space-y-3">
            {BANNED.map((b) => (
              <li key={b.title} className="rounded-2xl border border-line bg-white p-5">
                <p className="flex items-start gap-2.5 font-display text-[15px] font-bold text-ink">
                  <Ban className="mt-0.5 size-4 shrink-0 text-red-500" strokeWidth={2.2} />
                  {b.title}
                </p>
                <p className="mt-2 pl-[26px] text-[13px] leading-relaxed text-ink-500">{b.body}</p>
              </li>
            ))}
          </ul>

          <section className="mt-10">
            <h2 className="section-title text-ink">How this is enforced</h2>
            <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-700">
              <li>
                <strong className="font-bold text-ink">1. Keyword pre-screen.</strong>{" "}
                A maintained deny-list flags likely violations into a review queue
                on submit. It does not block outright — false positives frustrate
                honest sellers more than they stop dishonest ones.
              </li>
              <li>
                <strong className="font-bold text-ink">2. User reports.</strong>{" "}
                Every listing, request, bid and profile has a report control.
              </li>
              <li>
                <strong className="font-bold text-ink">3. Moderator review.</strong>{" "}
                A human decides. Content is hidden, removed, or the report is
                dismissed.
              </li>
              <li>
                <strong className="font-bold text-ink">4. Strikes.</strong> Three
                upheld reports within 90 days suspends the account automatically,
                pending review.
              </li>
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-brand-700">
              <ShieldAlert className="size-4" />
              On assignment writing
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-brand-700/85">
              It will be the most frequent thing reported here, and plenty of
              people do not think of it as cheating. We remove it. Not because it
              is the biggest harm on the list, but because a marketplace that
              looks away from the rule it states most often cannot be trusted on
              any of the others.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <Flag className="size-4 text-brand" />
              Seen something?
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
              Reports are read by a person, usually within a few hours.
            </p>
            <Link href="/report" className={buttonClasses("primary", "sm", "mt-4 w-full")}>
              Report it
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
