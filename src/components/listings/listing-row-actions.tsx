"use client";

import { useTransition } from "react";
import { setListingStatus, renewListing } from "@/lib/actions/listings";
import { buttonClasses } from "@/components/ui/button";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["listing_status"];

/** The one-tap action each listing row needs, chosen by its status. */
export function ListingRowActions({
  listingId,
  status,
}: {
  listingId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();

  if (status === "sold" || status === "removed") return null;

  const isStale = status === "expired" || status === "hidden";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (isStale) await renewListing(listingId);
          else await setListingStatus(listingId, "sold");
        })
      }
      className={buttonClasses("dark", "sm")}
    >
      {pending ? "…" : isStale ? "Re-list" : "Mark sold"}
    </button>
  );
}
