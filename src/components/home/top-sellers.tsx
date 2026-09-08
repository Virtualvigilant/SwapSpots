import Link from "next/link";
import type { ListingCardData } from "@/lib/queries/listings";
import { priceLabel, shortName } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { Thumb } from "@/components/ui/thumb";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { SectionHead } from "@/components/ui/section-head";

/**
 * §13: contact events are the closest thing to a sale we can see, so "moving
 * fastest" is the honest version of a best-sellers rail — it is ranked on the
 * one signal a discovery-only marketplace actually has.
 */
export function TopSellers({ listings }: { listings: ListingCardData[] }) {
  if (listings.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="container-page">
        <SectionHead
          title="Moving Fastest"
          href="/browse"
          linkLabel="Browse everything"
        />

        <ul className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="relative flex overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-gold px-2 py-1 text-[10px] font-bold leading-none text-ink">
                Most contacted
              </span>

              <div className="relative w-[44%] shrink-0 bg-surface-2">
                <Thumb
                  path={l.image_path}
                  alt={l.title}
                  sizes="(max-width: 768px) 45vw, 200px"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5 bg-white p-4">
                <Link
                  href={`/listings/${l.id}`}
                  className="truncate text-[14px] font-bold text-ink hover:text-brand"
                >
                  {l.title}
                </Link>
                <p className="text-[14px] font-extrabold text-ink">
                  {priceLabel(l.price, l.price_type)}
                </p>
                {l.seller_rating_count > 0 && (
                  <Rating
                    value={l.seller_rating_avg}
                    count={l.seller_rating_count}
                  />
                )}

                <Link
                  href={`/u/${l.seller_username}`}
                  className="flex min-w-0 items-center gap-2 text-[11.5px] text-ink-500 hover:text-ink"
                >
                  <Avatar
                    src={avatarUrl(l.seller_avatar_url)}
                    name={l.seller_name}
                    size={20}
                    verified={l.seller_verified}
                  />
                  <span className="truncate">{shortName(l.seller_name)}</span>
                </Link>

                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Link
                    href={`/listings/${l.id}`}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-ink px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand"
                  >
                    View Listing
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
