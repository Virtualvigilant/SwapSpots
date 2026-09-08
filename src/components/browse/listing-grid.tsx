import { PackageSearch } from "lucide-react";
import type { ListingCardData } from "@/lib/queries/listings";
import { ListingCard } from "@/components/ui/listing-card";
import { EmptyState } from "@/components/ui/empty-state";

export function ListingGrid({
  listings,
  savedIds,
  signedIn = false,
  emptyTitle = "Nothing here yet",
  emptyBody = "No live listings match this filter. Post a request instead and let sellers come to you.",
}: {
  listings: ListingCardData[];
  savedIds?: Set<string>;
  signedIn?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="size-5" />}
        title={emptyTitle}
        body={emptyBody}
        actionLabel="Post a request"
        actionHref="/requests/new"
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
      {listings.map((l, i) => (
        <li key={l.id}>
          <ListingCard
            listing={l}
            saved={savedIds?.has(l.id) ?? false}
            signedIn={signedIn}
            priority={i < 4}
          />
        </li>
      ))}
    </ul>
  );
}
