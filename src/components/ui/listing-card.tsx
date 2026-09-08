import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ListingCardData } from "@/lib/queries/listings";
import { priceLabel, conditionLabels } from "@/lib/format";
import { Thumb } from "./thumb";
import { Rating } from "./rating";
import { Badge } from "./badge";
import { FavoriteButton } from "@/components/listings/favorite-button";

export function ListingCard({
  listing,
  saved = false,
  signedIn = false,
  priority = false,
}: {
  listing: ListingCardData;
  saved?: boolean;
  signedIn?: boolean;
  priority?: boolean;
}) {
  const {
    id,
    title,
    price,
    price_type,
    condition,
    status,
    image_path,
    seller_rating_avg,
    seller_rating_count,
    seller_verified,
    pickup_area,
  } = listing;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link href={`/listings/${id}`} className="absolute inset-0">
          <Thumb
            path={image_path}
            alt={title}
            priority={priority}
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 220px"
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {status === "reserved" && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-ink px-2 py-1 text-[10px] font-bold leading-none text-white">
            Reserved
          </span>
        )}

        <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur">
          <FavoriteButton listingId={id} saved={saved} signedIn={signedIn} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/listings/${id}`}
          className="line-clamp-1 text-[13px] font-bold text-ink hover:text-brand"
        >
          {title}
        </Link>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[13.5px] font-extrabold text-ink">
            {priceLabel(price, price_type)}
          </span>
          {price_type === "negotiable" && (
            <span className="text-[10.5px] text-ink-400">negotiable</span>
          )}
        </div>

        {seller_rating_count > 0 ? (
          <Rating value={seller_rating_avg} count={seller_rating_count} />
        ) : (
          <Badge tone="muted">{conditionLabels[condition]}</Badge>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-ink-400">
            {seller_verified && (
              <BadgeCheck className="size-3.5 shrink-0 text-brand" strokeWidth={2} />
            )}
            <span className="truncate">{pickup_area ?? "On campus"}</span>
          </p>
          {/*
            Contact opens on the detail page, not from the grid. Revealing a
            number is rate-limited and logged as a contact event (§5.3) — one
            per card view would burn a day's quota scrolling.
          */}
          <Link
            href={`/listings/${id}`}
            className="shrink-0 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
