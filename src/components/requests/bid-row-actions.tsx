"use client";

import { useTransition } from "react";
import { withdrawBid } from "@/lib/actions/bids";
import { buttonClasses } from "@/components/ui/button";

export function WithdrawBidButton({
  bidId,
  requestId,
}: {
  bidId: string;
  requestId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => withdrawBid(bidId, requestId).then(() => {}))}
      className={buttonClasses("ghost", "sm")}
    >
      {pending ? "Withdrawing…" : "Withdraw"}
    </button>
  );
}
