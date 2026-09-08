import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getReviewsFor } from "@/lib/queries/profiles";
import { getCurrentProfile } from "@/lib/queries/session";
import { SectionLead } from "@/components/ui/section-lead";
import { Reputation } from "@/components/ui/reputation";
import { ReviewList } from "@/components/ui/review-list";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/me/settings");

  const reviews = await getReviewsFor(profile.id);

  return (
    <>
      <SectionLead
        title="Reviews"
        lead="What people said after dealing with you. A review is only possible when a contact event links you two on a specific listing or request — which is why there is no fake-review problem here."
      />

      <Reputation
        sellerRating={profile.seller_rating_avg}
        sellerRatingCount={profile.seller_rating_count}
        buyerRating={profile.buyer_rating_avg}
        buyerRatingCount={profile.buyer_rating_count}
      />

      <div className="mt-8">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-400">
          Recent
        </h3>
        <ReviewList reviews={reviews} />
      </div>
    </>
  );
}
