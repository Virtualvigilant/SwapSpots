import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, ShieldCheck, Trash2, Upload } from "lucide-react";
import { caps } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Student verification",
  description:
    "How SwapSpot plans to verify admission numbers, and what will happen to your ID photo.",
};

/**
 * Verification is designed but not switched on. Anyone with an account can
 * list, request and bid on the same terms, so this page explains what is
 * coming rather than asking anyone to submit an ID they do not need to.
 */
const STEPS = [
  {
    Icon: Upload,
    title: "Submit your admission number and ID photo",
    body: "The photo goes into a private storage bucket. It is never public and never appears on your profile.",
  },
  {
    Icon: Clock,
    title: "A moderator reviews it by hand",
    body: "Usually within a day. At our size a human is faster and more accurate than automation, and it means someone from the team has met every early user.",
  },
  {
    Icon: ShieldCheck,
    title: "Your badge appears",
    body: "A small check beside your name, for as long as the account is in good standing.",
  },
  {
    Icon: Trash2,
    title: "The photo is deleted after 30 days",
    body: "A scheduled job removes it. We keep only a one-way hash of the admission number, which is enough to stop the same number being used twice.",
  },
];

const LIMITS = [
  ["Active listings at once", String(caps.listings)],
  ["Requests per day", String(caps.requests)],
  ["Bids per day", String(caps.bids)],
  ["Contact reveals per day", String(caps.contacts)],
];

export default function VerificationPage() {
  return (
    <>
      <PageHeader
        title="Student verification"
        lead="The trust mechanism we are building toward. A scammer here can be found in a lecture hall — and that only works as a deterrent if everyone knows it."
        crumbs={[{ label: "Verification" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="font-display text-[15px] font-bold text-brand-700">
              Not required right now
            </p>
            <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-brand-700/80">
              Anyone with an account can browse, list, post a request and bid, on
              exactly the same terms. There is nothing to submit and nothing
              gated behind a badge. This page describes how verification will
              work when we turn it on.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="section-title text-ink">How it will work</h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map(({ Icon, title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="relative flex flex-col items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink">
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    {i < STEPS.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-line" />
                    )}
                  </span>
                  <div className="pb-1">
                    <p className="text-[14px] font-bold text-ink">{title}</p>
                    <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-ink-500">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="section-title text-ink">What applies to everyone</h2>
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-500">
              There are still limits, but they are the same for every account.
              They exist so one person cannot flood the board, not to push you
              toward verifying.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-surface text-left">
                  <tr>
                    <th className="px-4 py-3 font-bold text-ink">Limit</th>
                    <th className="px-4 py-3 font-bold text-brand">
                      Every account
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {LIMITS.map(([label, value]) => (
                    <tr key={label} className="border-t border-line">
                      <td className="px-4 py-3 text-ink-700">{label}</td>
                      <td className="px-4 py-3 font-bold text-ink">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-[17px] font-bold text-ink">
              Start selling now
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
              No admission number, no ID photo, no waiting on a moderator.
              Create an account and post.
            </p>
            <Link
              href="/sign-up"
              className={buttonClasses("primary", "md", "mt-5 w-full")}
            >
              Create an account
            </Link>
            <Link
              href="/listings/new"
              className={buttonClasses("outline", "md", "mt-2 w-full")}
            >
              Post a listing
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Lock className="size-4 text-brand" />
              Your privacy
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
              When verification does arrive, your ID photo will be visible only
              to moderators, never to other students, and destroyed 30 days after
              a decision. Your phone number is a separate matter and is already
              handled that way —{" "}
              <Link href="/terms" className="font-semibold text-brand hover:underline">
                read how
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
