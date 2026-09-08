import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Heart, MapPin, Pencil, ShieldCheck, Tag } from "lucide-react";
import {
  getListing,
  getListingsBySeller,
  getFavoriteIds,
} from "@/lib/queries/listings";
import { getCurrentProfile } from "@/lib/queries/session";
import {
  priceLabel,
  conditionLabels,
  priceTypeLabels,
  listingStatusLabels,
  timeAgo,
  daysUntil,

  shortName,
} from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { buttonClasses } from "@/components/ui/button";
import { ListingCard } from "@/components/ui/listing-card";
import { Gallery } from "@/components/listings/gallery";
import { ContactPanel } from "@/components/listings/contact-panel";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ReportButton } from "@/components/shared/report-button";
import { ViewCounter } from "@/components/shared/view-counter";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const l = await getListing(id);
  return l
    ? { title: l.title, description: l.description.slice(0, 160) }
    : { title: "Listing not found" };
}

export default async function ListingDetailPage({ params }: Params) {
  const { id } = await params;
  const [listing, profile] = await Promise.all([
    getListing(id),
    getCurrentProfile(),
  ]);
  if (!listing) notFound();

  const seller = listing.profiles;
  const isOwner = profile?.id === listing.seller_id;
  const isLive = listing.status === "active" || listing.status === "reserved";

  const [alsoFromSeller, savedIds] = await Promise.all([
    getListingsBySeller(listing.seller_id),
    profile ? getFavoriteIds(profile.id) : Promise.resolve(new Set<string>()),
  ]);

  const others = alsoFromSeller.filter((l) => l.id !== listing.id).slice(0, 4);

  return (
    <>
      <ViewCounter targetType="listing" targetId={listing.id} />

      <PageHeader
        title={listing.title}
        crumbs={[
          { label: "Browse", href: "/browse" },
          ...(listing.categories
            ? [
                {
                  label: listing.categories.name,
                  href: `/browse/${listing.categories.slug}`,
                },
              ]
            : []),
          { label: listing.title },
        ]}
      />

      {/* Explicit grid placement so the buy panel sits directly under the
          gallery on mobile instead of below the whole description. */}
      <div className="container-page flex flex-col py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <Gallery
            paths={listing.listing_images.map((i) => i.storage_path)}
            title={listing.title}
          />
        </div>

        <div className="order-3 mt-10 lg:col-start-1 lg:row-start-2 lg:mt-8">
          <section>
            <h2 className="section-title text-ink">Description</h2>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
              {listing.description}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="section-title text-ink">Details</h2>
            <dl className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {[
                ["Condition", conditionLabels[listing.condition]],
                ["Price type", priceTypeLabels[listing.price_type]],
                ["Category", listing.categories?.name ?? "—"],
                ["Pickup area", listing.pickup_area ?? "On campus"],
                ["Posted", timeAgo(listing.created_at)],
                [
                  "Expires in",
                  `${daysUntil(listing.expires_at)} days`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 bg-white px-4 py-3"
                >
                  <dt className="text-[12.5px] text-ink-500">{label}</dt>
                  <dd className="text-[12.5px] font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
              <ShieldCheck className="size-4 text-brand" />
              Meeting safely
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
              Meet somewhere public and busy — the library steps, the main gate,
              outside the tuition block. Inspect the item before you pay, and
              never send money before you have seen it.
            </p>
          </section>

          {others.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title mb-4 text-ink">
                More from @{seller?.username}
              </h2>
              <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {others.map((l) => (
                  <li key={l.id}>
                    <ListingCard
                      listing={l}
                      saved={savedIds.has(l.id)}
                      signedIn={Boolean(profile)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------------- sidebar */}
        <aside className="order-2 mt-8 space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              {!isLive && (
                <Badge tone="muted">{listingStatusLabels[listing.status]}</Badge>
              )}
              {listing.status === "reserved" && <Badge tone="ink">Reserved</Badge>}
              <Badge tone="muted">
                <Tag className="size-3" />
                {conditionLabels[listing.condition]}
              </Badge>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <p className="font-display text-[32px] font-extrabold tracking-[-0.04em] text-ink">
                {priceLabel(listing.price, listing.price_type)}
              </p>
            </div>
            <p className="mt-1 text-[12px] text-ink-500">
              {priceTypeLabels[listing.price_type]}
            </p>

            <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-500">
              <MapPin className="size-3.5 text-ink-400" />
              Collect at {listing.pickup_area ?? "a spot on campus"}
            </p>

            <div className="mt-5">
              {isOwner ? (
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className={buttonClasses("dark", "lg", "w-full")}
                >
                  <Pencil className="size-4" />
                  Edit your listing
                </Link>
              ) : isLive ? (
                <ContactPanel
                  targetType="listing"
                  targetId={listing.id}
                  signedIn={Boolean(profile)}
                />
              ) : (
                <p className="rounded-xl bg-surface px-4 py-3 text-center text-[12.5px] text-ink-500">
                  This listing is {listingStatusLabels[listing.status].toLowerCase()}{" "}
                  and can no longer be contacted.
                </p>
              )}
            </div>

            {!isOwner && (
              <div className="mt-4">
                <FavoriteButton
                  listingId={listing.id}
                  saved={savedIds.has(listing.id)}
                  signedIn={Boolean(profile)}
                  label
                  className="w-full justify-center rounded-lg border border-line bg-white py-2.5 text-[12.5px] font-semibold"
                />
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11.5px] text-ink-400">
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {listing.view_count.toLocaleString("en-KE")} views
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="size-3.5" />
                {listing.favorite_count} saves
              </span>
            </div>
          </div>

          {seller && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
                Seller
              </p>
              <Link
                href={`/u/${seller.username}`}
                className="mt-3 flex items-center gap-3"
              >
                <Avatar
                  src={avatarUrl(seller.avatar_url)}
                  name={seller.full_name}
                  size={46}
                  verified={seller.verification_status === "verified"}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-ink hover:text-brand">
                    {shortName(seller.full_name)}
                  </span>
                  <span className="mt-0.5 block">
                    <Rating
                      value={seller.seller_rating_avg}
                      count={seller.seller_rating_count}
                    />
                  </span>
                </span>
              </Link>

              <Link
                href={`/u/${seller.username}`}
                className={buttonClasses("outline", "sm", "mt-4 w-full")}
              >
                View profile
              </Link>
            </div>
          )}

          {profile && !isOwner && (
            <ReportButton targetType="listing" targetId={listing.id} />
          )}
        </aside>
      </div>
    </>
  );
}
