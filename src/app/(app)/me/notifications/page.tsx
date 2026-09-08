import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CircleAlert,
  Clock,
  Gavel,
  Phone,
  ShieldCheck,
  Star,
  Tag,
  Trophy,
} from "lucide-react";
import { getNotifications } from "@/lib/queries/notifications";
import { timeAgo } from "@/lib/format";
import { SectionLead } from "@/components/ui/section-lead";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton } from "@/components/shared/mark-read-button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Notifications" };

/** Keys are the `type` strings the triggers and RPCs in §8 write. */
const ICONS: Record<string, React.ElementType> = {
  new_bid: Gavel,
  bid_accepted: Trophy,
  request_closed: Clock,
  request_fulfilled: Trophy,
  request_expired: Clock,
  new_request_in_category: Tag,
  contact_revealed: Phone,
  review_received: Star,
  listing_expiring: BellRing,
  listing_expired: BellRing,
  verification_reviewed: ShieldCheck,
  moderation_action: CircleAlert,
  account_suspended: CircleAlert,
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <SectionLead
        title="Notifications"
        lead={`${unread} unread. Bids and contact reveals arrive here in realtime; high-value events also go to your email.`}
        action={<MarkAllReadButton disabled={unread === 0} />}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5" />}
          title="Nothing yet"
          body="Follow a category in settings and we will ping you the moment a matching request lands."
          actionLabel="Browse categories"
          actionHref="/categories"
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const unreadRow = !n.read_at;
            return (
              <li key={n.id} className="border-b border-line last:border-0">
                <Link
                  href={n.link ?? "/me/notifications"}
                  className={cn(
                    "flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-surface/70",
                    unreadRow && "bg-brand-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full",
                      unreadRow ? "bg-brand text-white" : "bg-surface text-ink-500",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold text-ink">
                        {n.title}
                      </span>
                      {unreadRow && (
                        <span className="size-1.5 rounded-full bg-brand" />
                      )}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11.5px] text-ink-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
