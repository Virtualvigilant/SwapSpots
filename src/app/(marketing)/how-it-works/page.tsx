import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  Gavel,
  HandCoins,
  MessagesSquare,
  Search,
  Star,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Two ways to trade on campus: post a listing, or post a request and let sellers bid for it.",
};

const BUYING = [
  { Icon: Search, title: "Find it", body: "Search or browse by category. Every listing is live — they expire after 30 days." },
  { Icon: WhatsAppIcon, title: "Reveal contact", body: "Tap once and WhatsApp opens with a message already written. The seller is told you asked." },
  { Icon: HandCoins, title: "Meet and pay", body: "Somewhere public. Inspect it, then pay the seller directly. We never touch the money." },
  { Icon: Star, title: "Leave a review", body: "Only possible because a contact event links you two. That is why the ratings here mean something." },
];

const SELLING = [
  { Icon: Camera, title: "Photograph it", body: "Daylight, plain background. Show the flaws — buyers trust it more, not less." },
  { Icon: BadgeCheck, title: "Post it", body: "Title, price, category, pickup area. Images compress on your phone, so it works on slow data." },
  { Icon: MessagesSquare, title: "Answer fast", body: "Response rate shows on your profile. The first seller to reply usually gets the sale." },
  { Icon: Trophy, title: "Build a record", body: "Your seller score is separate from your buyer score. Neither one hides the other." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How SwapSpot works"
        lead="Two ways to trade. Push something to the market by listing it, or pull the market to you by posting a request and letting sellers bid."
        crumbs={[{ label: "How it works" }]}
      />

      <div className="container-page py-10">
        <section className="rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <Gavel className="size-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[20px] font-extrabold tracking-[-0.03em] text-ink">
                The request board is the part that is different
              </h2>
              <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink-700">
                On WhatsApp, a “WTB” post scrolls away in minutes. Here it sits on
                a board with a timer. Sellers who follow the category are notified
                immediately and bid against each other — publicly, so everyone can
                see every amount. You award the one you want, and the moment you
                do, every other bidder is told it is closed.
              </p>
              <Link href="/requests/new" className={buttonClasses("primary", "md", "mt-5")}>
                Post a request
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-12">
          <Column title="Buying" steps={BUYING} />
          <Column title="Selling" steps={SELLING} />
        </div>

        <section className="mt-14 rounded-2xl border border-line bg-ink p-7 sm:p-10">
          <h2 className="font-display text-[24px] font-extrabold tracking-[-0.035em] text-white">
            Why there are no fees
          </h2>
          <p className="mt-3 max-w-[70ch] text-[14px] leading-relaxed text-white/65">
            The median deal on this campus is a few hundred shillings. A
            commission on that, after mobile money charges, is not a business —
            it is just friction between you and the sale. So SwapSpot does not
            process payments, hold funds, or act as escrow. It finds you the
            other person and gets out of the way.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/browse" className={buttonClasses("primary", "md")}>
              Browse listings
            </Link>
            <Link
              href="/sign-up"
              className={buttonClasses("outline", "md", "border-white/25 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink")}
            >
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Column({
  title,
  steps,
}: {
  title: string;
  steps: { Icon: React.ElementType; title: string; body: string }[];
}) {
  return (
    <section>
      <h2 className="section-title text-ink">{title}</h2>
      <ol className="mt-5 space-y-5">
        {steps.map(({ Icon, title: t, body }, i) => (
          <li key={t} className="flex gap-4">
            <span className="relative flex flex-col items-center">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink">
                <Icon className="size-[18px]" strokeWidth={1.8} />
              </span>
              {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
            </span>
            <div className="pb-1">
              <p className="text-[14px] font-bold text-ink">{t}</p>
              <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-ink-500">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
