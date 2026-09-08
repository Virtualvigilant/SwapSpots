import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ListingCardData } from "@/lib/queries/listings";
import { listingImageUrl } from "@/lib/images";
import { HeroBlob } from "./hero-blob";
import { HeroCard } from "./hero-card";

export function Hero({
  featured,
  stats,
}: {
  featured: ListingCardData[];
  stats: { listings: number; requests: number; members: number };
}) {
  // Only the listings that actually have a photo can float over the visual.
  const cards = featured
    .filter((l) => l.image_path)
    .slice(0, 4)
    .map((l) => ({
      title: l.title,
      price: l.price,
      priceType: l.price_type,
      image: listingImageUrl(l.image_path)!,
      href: `/listings/${l.id}`,
    }));

  const positions = [
    { className: "left-[2%] top-[4%] z-20", delay: "0s" },
    { className: "right-[1%] top-[12%] z-20", delay: "1.4s" },
    { className: "left-[-1%] top-[44%] z-20", delay: "2.6s" },
    { className: "bottom-[7%] right-[-1%] z-20", delay: "3.6s" },
  ];

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="container-page">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-6 lg:py-0">
          {/* ---------------------------------------------------------- copy */}
          <div className="relative z-20 max-w-[520px] lg:py-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand">
              Kabarak University
            </p>

            <h1 className="mt-4 font-display text-[42px] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink sm:text-[52px] lg:text-[58px] xl:text-[64px]">
              Find What You
              <br />
              Need On Campus
            </h1>

            <p className="mt-5 max-w-[330px] text-[15px] leading-relaxed text-ink-500">
              Browse listings from verified students, or post a request and let
              sellers bid for it.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/browse"
                className="inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-8 sm:w-auto text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_var(--color-brand-600)] transition-colors hover:bg-brand-600"
              >
                Browse Listings
              </Link>
              <Link
                href="/requests/new"
                className="inline-flex h-[50px] w-full items-center justify-center rounded-xl border border-line bg-white px-7 sm:w-auto text-[15px] font-semibold text-ink transition-colors hover:border-ink-400"
              >
                Post a Request
              </Link>
            </div>

            {/*
              Real counts, or nothing. Inventing social proof on a marketplace
              whose entire premise is trust is not a trade worth making.
            */}
            {stats.listings + stats.requests > 0 && (
              <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
                <Figure value={stats.listings} label="live listings" />
                <Figure value={stats.requests} label="open requests" />
                <Figure value={stats.members} label="students" />
              </dl>
            )}
          </div>

          {/* -------------------------------------------------------- visual */}
          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative aspect-[5/4.5] w-full lg:aspect-[5/4.35]">
              {/* orange organic shape */}
              <HeroBlob className="absolute bottom-[7%] left-[5%] h-[60%] w-[90%]" />

              {/* the student, arched out of the photo so the blob reads behind */}
              <div className="absolute bottom-[11%] left-1/2 h-[76%] w-[43%] -translate-x-1/2 overflow-hidden rounded-full shadow-[0_30px_60px_-30px_rgb(20_20_26/0.55)]">
                <Image
                  src="/images/hero-student.jpg"
                  alt="A Kabarak student browsing SwapSpot listings"
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 320px"
                  className="scale-110 object-cover object-top"
                />
                {/* warms the cool photo so it sits with the orange rather than fighting it */}
                <div className="absolute inset-0 bg-brand/12 mix-blend-multiply" />
              </div>

              {/* floating cards — real listings, newest first */}
              {cards.map((card, i) => (
                <HeroCard
                  key={card.href}
                  {...card}
                  {...positions[i]}
                />
              ))}

              {cards.length > 0 && (
                <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5">
                  <span className="h-1.5 w-5 rounded-full bg-ink" />
                  <span className="size-1.5 rounded-full bg-ink/25" />
                  <span className="size-1.5 rounded-full bg-ink/25" />
                  <ChevronRight className="ml-1 size-4 text-brand" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-display text-[22px] font-extrabold tracking-[-0.03em] text-ink">
          {value.toLocaleString("en-KE")}
        </span>
        <span className="ml-1.5 text-[13px] text-ink-500">{label}</span>
      </dd>
    </div>
  );
}
