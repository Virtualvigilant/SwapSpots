import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getListing } from "@/lib/queries/listings";
import { getCurrentProfile } from "@/lib/queries/session";
import { getCategories } from "@/lib/queries/categories";
import { daysUntil, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { ListingForm } from "@/components/listings/listing-form";
import { ListingAdminPanel } from "@/components/listings/listing-admin-panel";
import { buttonClasses } from "@/components/ui/button";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: Params) {
  const { id } = await params;
  const [listing, profile] = await Promise.all([
    getListing(id),
    getCurrentProfile(),
  ]);

  if (!listing) notFound();
  if (!profile) redirect(`/sign-in?next=/listings/${id}/edit`);

  // RLS would reject the write anyway; this just avoids showing a form that
  // cannot be submitted.
  const isStaff = profile.role === "moderator" || profile.role === "admin";
  if (listing.seller_id !== profile.id && !isStaff) {
    redirect(`/listings/${id}`);
  }

  const categories = await getCategories();

  return (
    <>
      <PageHeader
        title="Edit listing"
        lead={`Changes go live immediately. "${listing.title}" expires in ${daysUntil(listing.expires_at)} days.`}
        crumbs={[
          { label: "My listings", href: "/me/listings" },
          { label: listing.title, href: `/listings/${listing.id}` },
          { label: "Edit" },
        ]}
        action={
          <Link
            href={`/listings/${listing.id}`}
            className={buttonClasses("outline", "md")}
          >
            View listing
          </Link>
        }
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ListingForm
          userId={profile.id}
          categories={categories}
          listing={listing}
        />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Performance
            </p>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Views</dt>
                <dd className="font-bold text-ink">
                  {listing.view_count.toLocaleString("en-KE")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Saves</dt>
                <dd className="font-bold text-ink">{listing.favorite_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Contacts</dt>
                <dd className="font-bold text-ink">{listing.contact_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Posted</dt>
                <dd className="font-bold text-ink">
                  {timeAgo(listing.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          <ListingAdminPanel
            listingId={listing.id}
            status={listing.status}
            expiresInDays={daysUntil(listing.expires_at)}
          />
        </aside>
      </div>
    </>
  );
}
