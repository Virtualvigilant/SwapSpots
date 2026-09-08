import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Tag } from "lucide-react";
import { getRequest, getMyBidOn } from "@/lib/queries/requests";
import { getCurrentProfile } from "@/lib/queries/session";
import { kes, timeAgo, hoursUntil, shortName } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BidRow } from "@/components/requests/bid-row";
import { BidForm } from "@/components/requests/bid-form";
import { RequestOwnerPanel } from "@/components/requests/owner-actions";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { ContactPanel } from "@/components/listings/contact-panel";
import { ReportButton } from "@/components/shared/report-button";
import { ViewCounter } from "@/components/shared/view-counter";
import { RealtimeRefresh } from "@/components/shared/realtime-refresh";
import { buttonClasses } from "@/components/ui/button";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const r = await getRequest(id);
  return r
    ? { title: r.title, description: r.description.slice(0, 160) }
    : { title: "Request not found" };
}

export default async function RequestDetailPage({ params }: Params) {
  const { id } = await params;
  const [request, profile] = await Promise.all([
    getRequest(id),
    getCurrentProfile(),
  ]);
  if (!request) notFound();

  const isOwner = profile?.id === request.requester_id;
  const canAward = isOwner && request.status === "open";
  const isOpen = request.status === "open" && hoursUntil(request.expires_at) > 0;
  const lowestAmount = request.bids.length
    ? Math.min(...request.bids.map((b) => b.amount))
    : undefined;

  const myBid = profile ? await getMyBidOn(request.id, profile.id) : null;
  const awardedBid = request.bids.find((b) => b.id === request.awarded_bid_id);
  const iWon = Boolean(profile && awardedBid?.bidder_id === profile.id);

  const requester = request.profiles;
  const budget =
    request.budget_min !== null && request.budget_max !== null
      ? `${kes(request.budget_min)} – ${kes(request.budget_max)}`
      : request.budget_max !== null
        ? `Up to ${kes(request.budget_max)}`
        : request.budget_min !== null
          ? `From ${kes(request.budget_min)}`
          : "Open to offers";

  return (
    <>
      <ViewCounter targetType="request" targetId={request.id} />
      {/* §9.4: live bids, but only while the request is still open. */}
      {isOpen && (
        <RealtimeRefresh
          table="bids"
          filter={`request_id=eq.${request.id}`}
        />
      )}

      <PageHeader
        title={request.title}
        crumbs={[
          { label: "Requests", href: "/requests" },
          { label: request.title },
        ]}
      />

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <RequestStatusBadge status={request.status} />
              {request.categories && (
                <Link href={`/browse/${request.categories.slug}`}>
                  <Badge tone="muted">
                    <Tag className="size-3" />
                    {request.categories.name}
                  </Badge>
                </Link>
              )}
              <span className="text-[11.5px] text-ink-400">
                Posted {timeAgo(request.created_at)}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink-700">
              {request.description}
            </p>

            <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-[11.5px] text-ink-400">Budget</dt>
                <dd className="mt-1 font-display text-[16px] font-bold text-ink">
                  {budget}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-ink-400">Needed by</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-display text-[16px] font-bold text-ink">
                  <CalendarDays className="size-4 text-ink-400" />
                  {request.needed_by
                    ? new Date(request.needed_by).toLocaleDateString("en-KE", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })
                    : "Flexible"}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-ink-400">
                  {isOpen ? "Closes in" : "Status"}
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-display text-[16px] font-bold text-ink">
                  {isOpen ? (
                    <>
                      <Clock className="size-4 text-brand" />
                      {hoursUntil(request.expires_at)} hours
                    </>
                  ) : (
                    "Closed"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="section-title text-ink">
                Bids{" "}
                <span className="text-[14px] font-medium text-ink-400">
                  ({request.bids.length})
                </span>
              </h2>
              <p className="text-[11.5px] text-ink-400">
                Sorted by amount, lowest first
              </p>
            </div>

            {request.bids.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
                <p className="font-display text-[15px] font-bold text-ink">
                  No bids yet
                </p>
                <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-ink-500">
                  Sellers who follow{" "}
                  {request.categories?.name ?? "this category"} were notified when
                  this went up.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {request.bids.map((bid) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    lowest={bid.amount === lowestAmount}
                    canAward={canAward}
                    isMine={bid.bidder_id === profile?.id}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---------------------------------------------------------- sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              Requested by
            </p>
            <Link
              href={`/u/${requester?.username ?? ""}`}
              className="mt-3 flex items-center gap-3 hover:text-brand"
            >
              <Avatar
                src={avatarUrl(requester?.avatar_url)}
                name={requester?.full_name ?? "Someone"}
                size={44}
                verified={requester?.verification_status === "verified"}
              />
              <span>
                <span className="block text-[14px] font-bold text-ink">
                  {shortName(requester?.full_name ?? "Someone")}
                </span>
                <span className="block text-[12px] text-ink-400">
                  @{requester?.username}
                </span>
              </span>
            </Link>
          </div>

          {/*
            §5.3 — the winner and the requester can reach each other. award_bid
            already logged the contact event, so this only reveals the number.
          */}
          {request.status !== "open" && awardedBid && (isOwner || iWon) && (
            <ContactPanel
              targetType="bid"
              targetId={awardedBid.id}
              heading={isOwner ? "Contact the winner" : "Contact the requester"}
              blurb="You are both expected on WhatsApp from here. We never see the conversation or the money."
            />
          )}

          {isOpen && !isOwner && profile && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-[16px] font-bold text-ink">
                {myBid ? "Your bid" : "Place a bid"}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                One bid per person. You can edit it until the requester awards.
              </p>
              <BidForm requestId={request.id} existing={myBid} />
            </div>
          )}

          {isOpen && !isOwner && !profile && (
            <div className="rounded-2xl border border-line bg-white p-5 text-center">
              <p className="text-[13px] leading-relaxed text-ink-500">
                Sign in to bid on this request.
              </p>
              <Link
                href={`/sign-in?next=/requests/${request.id}`}
                className={buttonClasses("primary", "md", "mt-4 w-full")}
              >
                Sign in to bid
              </Link>
            </div>
          )}

          {isOwner && (
            <RequestOwnerPanel requestId={request.id} status={request.status} />
          )}

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              How bidding works
            </p>
            <ol className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink-500">
              <li>1. Everyone sees every bid amount and who placed it.</li>
              <li>2. The requester awards one bid before the timer runs out.</li>
              <li>3. Winner and requester swap numbers on WhatsApp.</li>
              <li>4. Once marked fulfilled, both sides can review each other.</li>
            </ol>
          </div>

          {profile && !isOwner && (
            <ReportButton targetType="request" targetId={request.id} />
          )}
        </aside>
      </div>
    </>
  );
}
