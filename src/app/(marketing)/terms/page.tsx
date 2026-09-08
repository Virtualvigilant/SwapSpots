import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Prose } from "@/components/ui/prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & privacy",
  description: `The rules for using ${site.name} and what we do with your data.`,
};

const SECTIONS = [
  { id: "what-this-is", label: "What SwapSpot is" },
  { id: "your-account", label: "Your account" },
  { id: "listings-requests", label: "Listings and requests" },
  { id: "transactions", label: "Transactions" },
  { id: "reviews", label: "Reviews" },
  { id: "data", label: "What we store" },
  { id: "phone", label: "Your phone number" },
  { id: "enforcement", label: "Suspension and removal" },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms & privacy"
        lead="Last updated 7 September 2026. Written to be read, not to be survived."
        crumbs={[{ label: "Terms" }]}
      />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
            On this page
          </p>
          <ul className="space-y-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block text-[12.5px] text-ink-500 hover:text-brand"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Prose>
          <h2 id="what-this-is">What SwapSpot is</h2>
          <p>
            SwapSpot is a noticeboard. It helps students at {site.campus} find each
            other. It is <strong>not</strong> a payment processor, an escrow
            service, a courier, or a party to any deal you make. We do not hold
            your money at any point, and we do not guarantee that anything listed
            here exists, works, or belongs to the person listing it.
          </p>
          <p>
            That is a real limitation and you should read it as one. What we do
            instead is make people identifiable and make their history visible.
          </p>

          <h2 id="your-account">Your account</h2>
          <p>
            One account per person. Every account can buy and sell — there is no
            separate seller signup, and no way to keep a good buying record while
            hiding a bad selling one.
          </p>
          <ul>
            <li>You must be a currently enrolled student to hold an account.</li>
            <li>Do not share your login. Actions taken from your account are yours.</li>
            <li>
              Verification requires a real admission number. Each one can only be
              used once — we store a one-way hash to enforce that.
            </li>
          </ul>

          <h2 id="listings-requests">Listings and requests</h2>
          <p>
            You are responsible for what you post. Describe things honestly,
            including the faults. Listings expire after 30 days and can be
            renewed. Requests close after the window you set, up to seven days.
          </p>
          <p>
            Some things may never be listed or requested here. The full list is on
            the{" "}
            <Link href="/prohibited-items">prohibited items</Link> page, and it is
            enforced consistently.
          </p>

          <h2 id="transactions">Transactions</h2>
          <p>
            Once you reveal a contact, the deal is between you and the other
            person. Meet somewhere public. Inspect before paying. Do not send money
            in advance to someone you have not met.
          </p>
          <p>
            We cannot recover funds, reverse a payment, or compel anyone to honour
            a bid. What we can do is act on the account, and a pattern of
            complaints does get acted on.
          </p>

          <h2 id="reviews">Reviews</h2>
          <p>
            You may only review someone if a contact event links the two of you on
            a specific listing or request. No contact, no review. This is the whole
            reason ratings here are worth reading.
          </p>
          <p>
            Buyer and seller scores are stored and shown separately and are never
            blended into a single number.
          </p>

          <h2 id="data">What we store</h2>
          <ul>
            <li>Your profile, listings, requests, bids and reviews.</li>
            <li>
              A record of each time you reveal someone&rsquo;s contact, and each
              time yours is revealed.
            </li>
            <li>
              A one-way hash of your admission number. The raw number is never
              stored.
            </li>
            <li>
              Your student ID photo, in a private bucket, deleted 30 days after a
              verification decision.
            </li>
          </ul>

          <h2 id="phone">Your phone number</h2>
          <p>
            Your number is never included in a page, a search result, or an API
            response. It is returned only when a signed-in user explicitly asks for
            it on a specific listing, and that request is rate-limited and logged.
          </p>
          <p>
            Once revealed, though, a number is out of our control and out of yours.
            Reveal is a deliberate action for that reason.
          </p>

          <h2 id="enforcement">Suspension and removal</h2>
          <p>
            Moderators may hide or remove content and suspend accounts. Three
            upheld reports within 90 days triggers an automatic suspension pending
            review.
          </p>
          <p>
            You can delete your account at any time from{" "}
            <Link href="/me/settings">settings</Link>. Reviews you wrote about
            other people remain, anonymised — otherwise deleting an account would
            be a way to erase a reputation you handed out.
          </p>
        </Prose>
      </div>
    </>
  );
}
