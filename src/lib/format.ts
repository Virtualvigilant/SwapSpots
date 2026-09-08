import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

/** KES is always shown whole — campus prices never have cents. */
export function kes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString("en-KE")}`;
}

/**
 * Price as it should read on a card, which depends on the price type: "Free"
 * carries no number, and "starting from" needs the qualifier or it reads as a
 * fixed price.
 */
export function priceLabel(
  amount: number,
  type: Enums["price_type"],
): string {
  if (type === "free") return "Free";
  if (type === "starting_from") return `From ${kes(amount)}`;
  return kes(amount);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "3 hours ago" / "yesterday". Rendered on the server, so no hydration skew. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) {
    const w = Math.floor(d / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

/** Whole hours until `iso`, floored at zero. Drives the request countdown. */
export function hoursUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / HOUR));
}

/** Whole days until `iso`, floored at zero. Drives the listing expiry note. */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));
}

/** "March 2025" — the join date on a profile. */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}

/** "12 Mar 2025" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const conditionLabels: Record<Enums["item_condition"], string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  for_parts: "For parts",
  not_applicable: "N/A",
};

export const priceTypeLabels: Record<Enums["price_type"], string> = {
  fixed: "Fixed",
  negotiable: "Negotiable",
  starting_from: "Starting from",
  free: "Free",
};

export const listingStatusLabels: Record<Enums["listing_status"], string> = {
  draft: "Draft",
  active: "Active",
  reserved: "Reserved",
  sold: "Sold",
  expired: "Expired",
  hidden: "Hidden",
  removed: "Removed",
};

export const requestStatusLabels: Record<Enums["request_status"], string> = {
  open: "Open",
  awarded: "Awarded",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const bidStatusLabels: Record<Enums["bid_status"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

/** First name plus an initial — how people are addressed across the UI. */
export function shortName(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}
