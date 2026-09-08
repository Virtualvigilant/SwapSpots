import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { buttonClasses } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${site.name} exists and what it deliberately does not do.`,
};

const PRINCIPLES = [
  {
    title: "Search beats scrolling",
    body: "A WhatsApp group buries a good listing in minutes. Here it is indexed, categorised and filterable for thirty days.",
  },
  {
    title: "Reputation has to persist",
    body: "A scammer can rejoin a group under a new number. They cannot re-verify an admission number that is already used.",
  },
  {
    title: "Requests deserve a home",
    body: "“Anyone selling a kettle?” scrolls away unseen. On a board with a timer, it collects competing bids instead.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title={`About ${site.name}`}
        lead={`A campus-scoped marketplace for ${site.campus}, built around one bet: that removing every barrier between having something and listing it is worth more than any commission we could charge.`}
        crumbs={[{ label: "About" }]}
      />

      <div className="container-page py-10">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title text-ink">We are not competing with Jiji</h2>
            <p className="mt-4 max-w-[62ch] text-[14px] leading-relaxed text-ink-700">
              The thing we actually replace is the campus buy-and-sell WhatsApp
              group. That is the incumbent, and it is a good one — it is free,
              everyone is already in it, and it works well enough that most people
              never look for an alternative.
            </p>
            <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-700">
              So we only beat it on three things: you can search, reputation
              follows people around, and asking for something is a first-class
              action instead of a message that disappears. Every feature here
              serves one of those three. If it does not, it is not built.
            </p>
            <Link href="/how-it-works" className={buttonClasses("primary", "md", "mt-6")}>
              See how it works
            </Link>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface">
            <Image
              src="/images/c-fashion.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="section-title text-ink">What we hold to</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="rounded-2xl border border-line bg-white p-6">
                <p className="font-display text-[16px] font-bold text-ink">{p.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="section-title text-ink">Where we are</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Live listings" value="1,179" />
            <Stat label="Students signed up" value="5,000+" />
            <Stat label="Verified accounts" value="63%" />
            <Stat label="Commission taken" value="KES 0" />
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-line bg-canvas p-7 sm:p-10">
          <h2 className="font-display text-[22px] font-extrabold tracking-[-0.035em] text-ink">
            What we deliberately do not do
          </h2>
          <ul className="mt-4 grid gap-3 text-[13.5px] leading-relaxed text-ink-700 sm:grid-cols-2">
            <li>
              <strong className="font-bold text-ink">Hold your money.</strong> No
              wallet, no escrow, no custody. That keeps us out of payments
              regulation and out of your transaction.
            </li>
            <li>
              <strong className="font-bold text-ink">Rebuild chat.</strong> You
              already have WhatsApp and so does everyone you are trading with.
            </li>
            <li>
              <strong className="font-bold text-ink">Arrange delivery.</strong>{" "}
              The whole campus is a ten-minute walk. Meet at the gate.
            </li>
            <li>
              <strong className="font-bold text-ink">Ship a native app.</strong>{" "}
              It installs from the browser. Nobody is downloading 40MB for this.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
