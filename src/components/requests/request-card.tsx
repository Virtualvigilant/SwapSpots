import Link from "next/link";
import { Clock, Gavel } from "lucide-react";
import type { RequestCardData } from "@/lib/queries/requests";
import { kes, hoursUntil, shortName } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "./request-status-badge";

export function RequestCard({ request: r }: { request: RequestCardData }) {
  const hoursLeft = hoursUntil(r.expires_at);
  const budget =
    r.budget_min !== null && r.budget_max !== null
      ? `${kes(r.budget_min)} – ${kes(r.budget_max)}`
      : r.budget_max !== null
        ? `Up to ${kes(r.budget_max)}`
        : r.budget_min !== null
          ? `From ${kes(r.budget_min)}`
          : "Open";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={r.status} />
          <Badge tone="muted">{r.category_name}</Badge>
        </div>
        {r.status === "open" && (
          <span className="flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-brand">
            <Clock className="size-3.5" />
            {hoursLeft}h left
          </span>
        )}
      </div>

      <h3 className="mt-3">
        <Link
          href={`/requests/${r.id}`}
          className="font-display text-[16px] font-bold leading-snug text-ink hover:text-brand"
        >
          {r.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
        {r.description}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
        <div>
          <dt className="text-ink-400">Budget</dt>
          <dd className="mt-0.5 font-bold text-ink">{budget}</dd>
        </div>
        {r.needed_by && (
          <div>
            <dt className="text-ink-400">Needed by</dt>
            <dd className="mt-0.5 font-bold text-ink">
              {new Date(r.needed_by).toLocaleDateString("en-KE", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </dd>
          </div>
        )}
        {r.lowest_bid !== null && (
          <div>
            <dt className="text-ink-400">Lowest bid</dt>
            <dd className="mt-0.5 font-bold text-brand">{kes(r.lowest_bid)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link
          href={`/u/${r.requester_username}`}
          className="flex min-w-0 items-center gap-2 text-[12px] text-ink-500 hover:text-ink"
        >
          <Avatar
            src={avatarUrl(r.requester_avatar_url)}
            name={r.requester_name}
            size={26}
            verified={r.requester_verified}
          />
          <span className="truncate">{shortName(r.requester_name)}</span>
        </Link>

        <Link
          href={`/requests/${r.id}`}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-brand"
        >
          <Gavel className="size-3.5" strokeWidth={2} />
          {r.bid_count} {r.bid_count === 1 ? "bid" : "bids"}
        </Link>
      </div>
    </article>
  );
}
