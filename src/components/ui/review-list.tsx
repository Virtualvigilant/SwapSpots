import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import type { ReviewWithAuthor } from "@/lib/queries/profiles";
import { timeAgo, shortName } from "@/lib/format";
import { avatarUrl } from "@/lib/images";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Rating } from "./rating";
import { EmptyState } from "./empty-state";

export function ReviewList({ reviews }: { reviews: ReviewWithAuthor[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareQuote className="size-5" />}
        title="No reviews yet"
        body="A review can only be written after a contact event links two people on a specific listing or request. No contact, no review."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const author = r.profiles;
        const name = author?.full_name ?? "Someone";
        return (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  src={avatarUrl(author?.avatar_url)}
                  name={name}
                  size={38}
                  verified={author?.verification_status === "verified"}
                />
                <div className="min-w-0">
                  <Link
                    href={`/u/${author?.username ?? ""}`}
                    className="block truncate text-[13.5px] font-bold text-ink hover:text-brand"
                  >
                    {shortName(name)}
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-ink-400">
                    on a {r.context_type} · {timeAgo(r.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Rating value={r.rating} />
                <Badge tone={r.reviewed_role === "seller" ? "info" : "muted"}>
                  {r.reviewed_role === "seller" ? "As seller" : "As buyer"}
                </Badge>
              </div>
            </div>
            {r.comment && (
              <p className="mt-3 text-[13px] leading-relaxed text-ink-700">
                {r.comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
