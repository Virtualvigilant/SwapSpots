"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { cn } from "@/lib/cn";

/**
 * Optimistic save toggle. Signed-out visitors are sent to sign-in rather than
 * silently failing — RLS would reject the insert anyway.
 */
export function FavoriteButton({
  listingId,
  saved,
  signedIn,
  className,
  label = false,
}: {
  listingId: string;
  saved: boolean;
  signedIn: boolean;
  className?: string;
  label?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(saved);

  function onClick() {
    if (!signedIn) {
      router.push(`/sign-in?next=/listings/${listingId}`);
      return;
    }
    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleFavorite(listingId, optimistic);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={optimistic ? "Remove from saved" : "Save this listing"}
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors disabled:opacity-60",
        optimistic ? "text-brand" : "text-ink-500 hover:text-brand",
        className,
      )}
    >
      <Heart
        className="size-3.5"
        strokeWidth={1.9}
        fill={optimistic ? "currentColor" : "none"}
      />
      {label && (optimistic ? "Saved" : "Save")}
    </button>
  );
}
