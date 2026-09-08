import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Heart, Package, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { getMyListings } from "@/lib/queries/listings";
import { getCurrentProfile } from "@/lib/queries/session";
import { kes, daysUntil, listingStatusLabels } from "@/lib/format";
import { SectionLead } from "@/components/ui/section-lead";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Thumb } from "@/components/ui/thumb";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingRowActions } from "@/components/listings/listing-row-actions";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "My listings" };

const TONES: Record<Database["public"]["Enums"]["listing_status"], BadgeTone> = {
  draft: "muted",
  active: "success",
  reserved: "info",
  sold: "ink",
  expired: "muted",
  hidden: "muted",
  removed: "danger",
};

export default async function MyListingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/me/settings");

  const mine = await getMyListings(profile.id);
  const active = mine.filter(
    (l) => l.status === "active" || l.status === "reserved",
  );

  return (
    <>
      <SectionLead
        title="My listings"
        lead="Everything you have posted. Listings expire after 30 days — you get a reminder at day 27."
        action={
          <Link href="/listings/new" className={buttonClasses("primary", "sm")}>
            Post a listing
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active" value={String(active.length)} />
        <Stat
          label="Total views"
          value={mine
            .reduce((n, l) => n + l.view_count, 0)
            .toLocaleString("en-KE")}
        />
        <Stat
          label="Saves"
          value={String(mine.reduce((n, l) => n + l.favorite_count, 0))}
        />
        <Stat label="Sold all time" value={String(profile.listings_sold_count)} />
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="Nothing listed yet"
          body="Post the first thing you are not using. It takes about two minutes."
          actionLabel="Post a listing"
          actionHref="/listings/new"
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-3 sm:flex-nowrap"
            >
              <Link
                href={`/listings/${l.id}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface"
              >
                <Thumb path={l.image_path} alt="" sizes="80px" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/listings/${l.id}`}
                    className="truncate text-[14px] font-bold text-ink hover:text-brand"
                  >
                    {l.title}
                  </Link>
                  <Badge tone={TONES[l.status]}>
                    {listingStatusLabels[l.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] font-extrabold text-ink">
                  {kes(l.price)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-400">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {l.view_count.toLocaleString("en-KE")} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5" />
                    {l.favorite_count} saves
                  </span>
                  <span>{l.contact_count} contacts</span>
                  {l.status === "active" && (
                    <span>Expires in {daysUntil(l.expires_at)} days</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/listings/${l.id}/edit`}
                  className={buttonClasses("outline", "sm")}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
                <ListingRowActions listingId={l.id} status={l.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
