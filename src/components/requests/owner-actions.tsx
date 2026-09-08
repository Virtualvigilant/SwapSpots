"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import {
  awardBid,
  markRequestFulfilled,
  cancelRequest,
} from "@/lib/actions/requests";
import { buttonClasses } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import type { ActionState } from "@/lib/validation/shared";

/**
 * Awarding is irreversible — it closes the request, rejects every other bid and
 * notifies all of them in one transaction (§5.2). So it asks first.
 */
export function AwardButton({
  requestId,
  bidId,
  bidderName,
}: {
  requestId: string;
  bidId: string;
  bidderName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  if (state?.error) {
    return <span className="text-[11.5px] font-semibold text-red-600">{state.error}</span>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={buttonClasses("dark", "sm")}
      >
        Award this bid
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[11.5px] text-ink-500">
        Award {bidderName}? This closes the request.
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setState(await awardBid(requestId, bidId)))
        }
        className={buttonClasses("primary", "sm")}
      >
        {pending ? "Awarding…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className={buttonClasses("ghost", "sm")}
      >
        Cancel
      </button>
    </span>
  );
}

export function RequestOwnerPanel({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
      <p className="flex items-center gap-2 font-display text-[14px] font-bold text-brand-700">
        <AlertCircle className="size-4" />
        You own this request
      </p>

      {status === "open" && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-brand-700/80">
          Awarding a bid closes the request immediately, tells every other
          bidder, and opens a WhatsApp handoff with the winner. It cannot be
          undone.
        </p>
      )}

      {status === "awarded" && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-brand-700/80">
          Once you have the item, mark this fulfilled — that is what unlocks
          reviews for both of you.
        </p>
      )}

      <div className="mt-4 space-y-3">
        <FormStatus state={state} />

        {status === "awarded" && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () =>
                setState(await markRequestFulfilled(requestId)),
              )
            }
            className={buttonClasses("dark", "sm", "w-full")}
          >
            {pending ? "Saving…" : "Mark fulfilled"}
          </button>
        )}

        {(status === "open" || status === "awarded") && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () =>
                setState(await cancelRequest(requestId)),
              )
            }
            className={buttonClasses("outline", "sm", "w-full")}
          >
            Cancel request
          </button>
        )}
      </div>
    </div>
  );
}
