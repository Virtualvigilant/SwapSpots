import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/session";
import { getCategories } from "@/lib/queries/categories";
import { getMyListings } from "@/lib/queries/listings";
import { caps } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { ListingForm } from "@/components/listings/listing-form";

export const metadata: Metadata = { title: "Post a listing" };

export default async function NewListingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/listings/new");

  const [categories, mine] = await Promise.all([
    getCategories(),
    getMyListings(profile.id),
  ]);

  const active = mine.filter(
    (l) => l.status === "active" || l.status === "reserved",
  ).length;

  return (
    <>
      <PageHeader
        title="Post a listing"
        lead="Anything you are selling, renting or offering as a service. It stays live for 30 days and we will remind you before it expires."
        crumbs={[{ label: "Browse", href: "/browse" }, { label: "New listing" }]}
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        {active >= caps.listings ? (
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="font-display text-[16px] font-bold text-ink">
              You are at your listing cap
            </p>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-500">
              {active} of {caps.listings} active listings. Mark something sold or
              hide a listing to free up a slot.
            </p>
            <Link
              href="/me/listings"
              className="mt-4 inline-block text-[13px] font-semibold text-brand hover:underline"
            >
              Manage my listings
            </Link>
          </div>
        ) : (
          <ListingForm
            userId={profile.id}
            categories={categories}
            defaultPickup={profile.pickup_area}
          />
        )}

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-ink">
              <Info className="size-4 text-brand" />
              Listings that sell
            </p>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink-500">
              <li>Daylight, plain background, no filter.</li>
              <li>Photograph the flaws — buyers trust it more, not less.</li>
              <li>Put the size or model in the title, not just the description.</li>
              <li>Mark it negotiable if it is. Fixed prices get fewer messages.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Your limits
            </p>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Active listings</dt>
                <dd className="font-bold text-ink">
                  {active} of {caps.listings}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
              The cap is there to stop one account flooding the catalogue.
              Expired and sold listings do not count against it.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Not allowed
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
              Assignment writing, alcohol, vapes, prescription medicine, weapons,
              adult services and anything financial.{" "}
              <Link
                href="/prohibited-items"
                className="font-semibold text-brand hover:underline"
              >
                Full list
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
