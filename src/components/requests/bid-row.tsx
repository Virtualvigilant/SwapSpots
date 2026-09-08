import Link from "next/link";
import { Check, Clock3, X } from "lucide-react";
import type { BidWithBidder } from "@/lib/queries/requests";
import { kes, timeAgo, shortName, bidStatusLabels } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { AwardButton } from "./owner-actions";
import { cn } from "@/lib/cn";

/**
 * One bid on a request. Amount and bidder identity are both public — open
 * bidding is what drives the price down (§5.2).
 */
export function BidRow({
  bid,
  lowest,
  canAward,
  isMine,
}: {
  bid: BidWithBidder;
  lowest: boolean;
  canAward: boolean;
  isMine: boolean;
}) {
  const accepted = bid.status === "accepted";
  const rejected = bid.status === "rejected" || bid.status === "expired";
  const bidder = bid.profiles;
  const name = bidder?.full_name ?? "Someone";

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white p-4 sm:p-5",
        accepted ? "border-emerald-300 bg-emerald-50/40" : "border-line",
        rejected && "opacity-55",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            src={avatarUrl(bidder?.avatar_url)}
            name={name}
            size={40}
            verified={bidder?.verification_status === "verified"}
          />
          <div className="min-w-0">
            <Link
              href={`/u/${bidder?.username ?? ""}`}
              className="block truncate text-[13.5px] font-bold text-ink hover:text-brand"
            >
              {shortName(name)}
              {isMine && (
                <span className="ml-1.5 text-[11px] font-medium text-ink-400">
                  (you)
                </span>
              )}
            </Link>
            <div className="mt-0.5">
              <Rating
                value={bidder?.seller_rating_avg ?? 0}
                count={bidder?.seller_rating_count ?? 0}
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-[20px] font-extrabold tracking-[-0.03em] text-ink">
            {kes(bid.amount)}
          </p>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            {lowest && !rejected && !accepted && <Badge tone="brand">Lowest</Badge>}
            {accepted && (
              <Badge tone="success">
                <Check className="size-3" strokeWidth={3} />
                Awarded
              </Badge>
            )}
            {rejected && (
              <Badge tone="muted">
                <X className="size-3" strokeWidth={3} />
                {bidStatusLabels[bid.status]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {bid.message && (
        <p className="mt-3.5 text-[13px] leading-relaxed text-ink-700">
          {bid.message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-ink-400">
          {bid.availability && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              Can deliver {bid.availability.toLowerCase()}
            </span>
          )}
          <span>Placed {timeAgo(bid.created_at)}</span>
        </div>

        {canAward && bid.status === "pending" && (
          <AwardButton
            requestId={bid.request_id}
            bidId={bid.id}
            bidderName={shortName(name)}
          />
        )}
      </div>
    </li>
  );
}
