"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import {
  setListingStatus,
  renewListing,
  deleteListing,
} from "@/lib/actions/listings";
import { buttonClasses } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import type { ActionState } from "@/lib/validation/shared";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["listing_status"];

/** Seller-side status controls. `removed` is a moderator action, so not here. */
export function ListingAdminPanel({
  listingId,
  status,
  expiresInDays,
}: {
  listingId: string;
  status: Status;
  expiresInDays: number;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => setState(await fn()));

  return (
    <>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
          Status
        </p>
        <div className="mt-3 space-y-2">
          <FormStatus state={state} />

          {status !== "reserved" && status !== "sold" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setListingStatus(listingId, "reserved"))}
              className={buttonClasses("outline", "sm", "w-full")}
            >
              Mark as reserved
            </button>
          )}
          {status === "reserved" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setListingStatus(listingId, "active"))}
              className={buttonClasses("outline", "sm", "w-full")}
            >
              Back to active
            </button>
          )}
          {status !== "sold" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setListingStatus(listingId, "sold"))}
              className={buttonClasses("dark", "sm", "w-full")}
            >
              Mark as sold
            </button>
          )}
          {status !== "hidden" && status !== "sold" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setListingStatus(listingId, "hidden"))}
              className={buttonClasses("outline", "sm", "w-full")}
            >
              Hide from search
            </button>
          )}
          {(status === "hidden" || status === "expired" || status === "sold") && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => renewListing(listingId))}
              className={buttonClasses("primary", "sm", "w-full")}
            >
              Re-list for 30 days
            </button>
          )}
          {status === "active" && expiresInDays <= 3 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => renewListing(listingId))}
              className={buttonClasses("primary", "sm", "w-full")}
            >
              Renew — expires in {expiresInDays} days
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <p className="flex items-center gap-2 text-[12.5px] font-bold text-red-700">
          <AlertTriangle className="size-4" />
          Delete listing
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-red-700/75">
          Permanent. Reviews tied to this listing stay on your profile.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteListing(listingId))}
              className={buttonClasses("danger", "sm", "flex-1")}
            >
              {pending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className={buttonClasses("ghost", "sm")}
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className={buttonClasses("danger", "sm", "mt-3 w-full")}
          >
            Delete permanently
          </button>
        )}
      </div>
    </>
  );
}
