import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on selling, staying safe, and what is moving on campus.",
};

const POSTS = [
  {
    slug: "photograph-what-you-sell",
    tag: "Selling",
    title: "Photograph the flaws. It sells faster.",
    excerpt:
      "The instinct is to hide the scuff. Every seller with a 4.8 does the opposite — and gets fewer time-wasters at the meetup.",
    image: "/images/c-fashion.jpg",
    date: "4 September 2026",
    readTime: "4 min",
  },
  {
    slug: "semester-open-checklist",
    tag: "Campus",
    title: "What actually sells in the first two weeks",
    excerpt:
      "Mattresses, kettles, buckets, extension cables. Semester open is the single biggest demand spike of the year — here is what to list before it starts.",
    image: "/images/c-hostel.jpg",
    date: "28 August 2026",
    readTime: "6 min",
  },
  {
    slug: "how-to-price",
    tag: "Selling",
    title: "How to price second-hand without guessing",
    excerpt:
      "Start from what the same thing sold for here last month, not from what you paid. A worked example on three real listings.",
    image: "/images/c-rentals.jpg",
    date: "21 August 2026",
    readTime: "5 min",
  },
  {
    slug: "spotting-a-scam",
    tag: "Safety",
    title: "Six things a scammer does that an honest seller does not",
    excerpt:
      "Pressure to pay before meeting, a price far under market, a brand-new unverified account. None of these is proof on its own. Three together is.",
    image: "/images/c-electronics.jpg",
    date: "14 August 2026",
    readTime: "7 min",
  },
  {
    slug: "requests-that-get-bids",
    tag: "Requests",
    title: "Requests that get bids in under an hour",
    excerpt:
      "The difference is almost always specificity and a budget range. “Fridge” gets nothing. “Mini fridge under 90L, KES 6–9k” gets three bids.",
    image: "/images/c-others.jpg",
    date: "7 August 2026",
    readTime: "4 min",
  },
  {
    slug: "why-no-fees",
    tag: "Product",
    title: "Why we will never take a commission",
    excerpt:
      "A percentage of a KES 200 sale, after mobile money charges, is not a business. It is just a reason for you to trade somewhere else.",
    image: "/images/c-food.jpg",
    date: "31 July 2026",
    readTime: "3 min",
  },
];

export default function BlogPage() {
  const [lead, ...rest] = POSTS;

  return (
    <>
      <PageHeader
        title="Blog"
        lead="Notes on selling well, staying safe, and what is moving on campus this month."
        crumbs={[{ label: "Blog" }]}
      />

      <div className="container-page py-10">
        {/*
          These are planned pieces, not published ones — there is no
          /blog/[slug] route yet. Add the route and restore the links when the
          first post is actually written.
        */}
        <p className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink-500">
          These are the pieces we are writing first. Nothing here is published
          yet — check back, or tell us which one you want soonest on the{" "}
          <Link href="/contact" className="font-semibold text-brand hover:underline">
            contact page
          </Link>
          .
        </p>

        <article className="grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden bg-surface lg:aspect-auto">
            <Image
              src={lead.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-9">
            <Badge tone="brand" className="self-start">
              {lead.tag}
            </Badge>
            <h2 className="mt-4 font-display text-[26px] font-extrabold leading-tight tracking-[-0.035em] text-ink">
              {lead.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-500">{lead.excerpt}</p>
            <p className="mt-5 flex items-center gap-2 text-[12px] text-ink-400">
              {lead.date}
              <span className="size-1 rounded-full bg-ink-400" />
              {lead.readTime} read
            </p>
          </div>
        </article>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.slug}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 380px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <Badge tone="muted" className="self-start">
                    {p.tag}
                  </Badge>
                  <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-500">
                    {p.excerpt}
                  </p>
                  <p className="mt-4 text-[11.5px] text-ink-400">{p.date}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
