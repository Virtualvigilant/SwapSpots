"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListingCardData } from "@/lib/queries/listings";
import { ListingCard } from "@/components/ui/listing-card";
import { SectionHead } from "@/components/ui/section-head";

export function NewArrivals({
  listings,
  savedIds,
  signedIn,
}: {
  listings: ListingCardData[];
  savedIds?: string[];
  signedIn: boolean;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const saved = new Set(savedIds ?? []);

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    // Advance by roughly one card plus its gap, whatever the breakpoint.
    el.scrollBy({ left: dir * (el.clientWidth / 3), behavior: "smooth" });
  };

  if (listings.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="container-page relative">
        <SectionHead
          title="New Arrivals"
          href="/browse"
          linkLabel="View All New Arrivals"
        />

        <ul
          ref={rail}
          className="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-1"
        >
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="w-[58%] shrink-0 snap-start sm:w-[38%] lg:w-[calc((100%-4*0.875rem)/5)] xl:w-[calc((100%-5*0.875rem)/6)]"
            >
              <ListingCard
                listing={listing}
                saved={saved.has(listing.id)}
                signedIn={signedIn}
              />
            </li>
          ))}
        </ul>

        {listings.length > 3 && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll to previous listings"
              className="absolute -left-1 top-1/2 z-10 hidden size-9 place-items-center rounded-full border border-line bg-white text-ink shadow-[var(--shadow-soft)] transition-colors hover:border-brand hover:text-brand xl:grid"
            >
              <ChevronLeft className="size-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll to more listings"
              className="absolute -right-1 top-1/2 z-10 hidden size-9 place-items-center rounded-full border border-line bg-white text-ink shadow-[var(--shadow-soft)] transition-colors hover:border-brand hover:text-brand xl:grid"
            >
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
