import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, MessageSquareReply } from "lucide-react";
import {
  getProfileByUsername,
  getReviewsFor,
  getContactStats,
} from "@/lib/queries/profiles";
import { getListingsBySeller, getFavoriteIds } from "@/lib/queries/listings";
import { searchRequests } from "@/lib/queries/requests";
import { getCurrentProfile } from "@/lib/queries/session";
import { monthYear } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { Reputation } from "@/components/ui/reputation";
import { ReviewList } from "@/components/ui/review-list";
import { ListingGrid } from "@/components/browse/listing-grid";
import { RequestCard } from "@/components/requests/request-card";
import { ReportButton } from "@/components/shared/report-button";

type Params = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const p = await getProfileByUsername(username);
  return p
    ? { title: p.full_name, description: p.bio ?? undefined }
    : { title: "Profile not found" };
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [theirListings, reviews, stats, viewer, allRequests] = await Promise.all([
    getListingsBySeller(profile.id),
    getReviewsFor(profile.id),
    getContactStats(profile.id),
    getCurrentProfile(),
    searchRequests({ openOnly: true, perPage: 50 }),
  ]);

  const theirRequests = allRequests.items.filter(
    (r) => r.requester_id === profile.id,
  );
  const savedIds = viewer ? await getFavoriteIds(viewer.id) : undefined;
  const isSelf = viewer?.id === profile.id;
  const verified = profile.verification_status === "verified";

  return (
    <>
      <PageHeader
        title={profile.full_name}
        crumbs={[{ label: `@${profile.username}` }]}
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-3.5">
              <Avatar
                src={avatarUrl(profile.avatar_url)}
                name={profile.full_name}
                size={60}
                verified={verified}
              />
              <div className="min-w-0">
                <p className="truncate font-display text-[17px] font-bold text-ink">
                  {profile.full_name}
                </p>
                <p className="text-[12.5px] text-ink-400">@{profile.username}</p>
              </div>
            </div>

            <Badge tone={verified ? "success" : "muted"} className="mt-4">
              {verified ? "Verified student" : "Not yet verified"}
            </Badge>

            {profile.bio && (
              <p className="mt-4 text-[13px] leading-relaxed text-ink-700">
                {profile.bio}
              </p>
            )}

            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[12.5px]">
              {profile.pickup_area && (
                <div className="flex items-center gap-2 text-ink-500">
                  <MapPin className="size-3.5 text-ink-400" />
                  Usually meets at {profile.pickup_area}
                </div>
              )}
              <div className="flex items-center gap-2 text-ink-500">
                <CalendarDays className="size-3.5 text-ink-400" />
                Joined {monthYear(profile.created_at)}
              </div>
              {stats.responseRate !== null && (
                <div className="flex items-center gap-2 text-ink-500">
                  <MessageSquareReply className="size-3.5 text-ink-400" />
                  {stats.reviews} reviews from {stats.contacts} contacts
                </div>
              )}
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Items sold" value={String(profile.listings_sold_count)} />
            <Stat
              label="Requests filled"
              value={String(profile.requests_fulfilled_count)}
            />
          </div>

          {viewer && !isSelf && (
            <ReportButton targetType="profile" targetId={profile.id} />
          )}
        </aside>

        <div className="space-y-10">
          <section>
            <h2 className="section-title mb-4 text-ink">Reputation</h2>
            <Reputation
              sellerRating={profile.seller_rating_avg}
              sellerRatingCount={profile.seller_rating_count}
              buyerRating={profile.buyer_rating_avg}
              buyerRatingCount={profile.buyer_rating_count}
            />
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
              Scores are kept separate on purpose. Someone can be a dependable
              buyer and an unreliable seller — one blended number would hide that.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 text-ink">
              Live listings{" "}
              <span className="text-[14px] font-medium text-ink-400">
                ({theirListings.length})
              </span>
            </h2>
            <ListingGrid
              listings={theirListings}
              savedIds={savedIds}
              signedIn={Boolean(viewer)}
              emptyTitle="Nothing listed right now"
              emptyBody={`${profile.full_name} has no live listings at the moment.`}
            />
          </section>

          {theirRequests.length > 0 && (
            <section>
              <h2 className="section-title mb-4 text-ink">Open requests</h2>
              <ul className="grid gap-3.5 sm:grid-cols-2">
                {theirRequests.map((r) => (
                  <li key={r.id}>
                    <RequestCard request={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="section-title mb-4 text-ink">Reviews</h2>
            <ReviewList reviews={reviews} />
          </section>
        </div>
      </div>
    </>
  );
}
