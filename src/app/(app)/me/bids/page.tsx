import type { Metadata } from "next";
import Link from "next/link";
import { Gavel } from "lucide-react";
import { redirect } from "next/navigation";
import { getMyBids } from "@/lib/queries/requests";
import { getCurrentProfile } from "@/lib/queries/session";
import { kes, timeAgo, shortName } from "@/lib/format";
import { SectionLead } from "@/components/ui/section-lead";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WithdrawBidButton } from "@/components/requests/bid-row-actions";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "My bids" };

const STATUS: Record<
  Database["public"]["Enums"]["bid_status"],
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "Awaiting decision", tone: "info" },
  accepted: { label: "Won", tone: "success" },
  rejected: { label: "Not selected", tone: "muted" },
  withdrawn: { label: "Withdrawn", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
};

export default async function MyBidsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/me/settings");

  const mine = await getMyBids(profile.id);
  const won = mine.filter((b) => b.status === "accepted").length;

  return (
    <>
      <SectionLead
        title="My bids"
        lead={`${mine.length} ${mine.length === 1 ? "bid" : "bids"} placed, ${won} won. You can edit a bid right up until the requester awards it.`}
        action={
          <Link href="/requests" className={buttonClasses("outline", "sm")}>
            Browse requests
          </Link>
        }
      />

      {mine.length === 0 ? (
        <EmptyState
          icon={<Gavel className="size-5" />}
          title="No bids yet"
          body="The request board is where sellers find buyers who have already decided to spend. Bidding takes a minute."
          actionLabel="See the request board"
          actionHref="/requests"
        />
      ) : (
        <ul className="space-y-3">
          {mine.map((bid) => {
            const { label, tone } = STATUS[bid.status];
            const request = bid.requests;
            const requester = request?.profiles;
            return (
              <li
                key={bid.id}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/requests/${bid.request_id}`}
                      className="text-[14px] font-bold text-ink hover:text-brand"
                    >
                      {request?.title ?? "Request"}
                    </Link>
                    <p className="mt-1 text-[11.5px] text-ink-400">
                      {requester && <>by {shortName(requester.full_name)} · </>}
                      placed {timeAgo(bid.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[18px] font-extrabold text-ink">
                      {kes(bid.amount)}
                    </p>
                    <Badge tone={tone} className="mt-1">
                      {label}
                    </Badge>
                  </div>
                </div>

                {bid.message && (
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
                    {bid.message}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/requests/${bid.request_id}`}
                    className={buttonClasses("outline", "sm")}
                  >
                    {bid.status === "pending" ? "View and edit" : "View request"}
                  </Link>
                  {bid.status === "pending" && (
                    <WithdrawBidButton
                      bidId={bid.id}
                      requestId={bid.request_id}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
