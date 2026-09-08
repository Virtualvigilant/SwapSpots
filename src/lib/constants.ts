import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

/**
 * Choices that are not rows in a table. Pickup areas are campus geography
 * rather than reference data — they change when the university builds a hostel,
 * not when an admin edits something, so they live in code.
 */
export const pickupAreas = [
  "Main Gate",
  "Library",
  "Tuition Block",
  "Hostel A",
  "Hostel B",
  "Hostel C",
  "Hostel D",
  "Sports Complex",
];

export const availabilityOptions = [
  "Today",
  "Tomorrow",
  "Within 2 days",
  "This week",
  "Next week",
];

/** §5.2: the requester picks the window; 48h is the default. */
export const requestDurations = [
  { value: "24", label: "24 hours" },
  { value: "48", label: "48 hours (default)" },
  { value: "168", label: "7 days" },
];

export const conditionOptions: Enums["item_condition"][] = [
  "new",
  "like_new",
  "good",
  "fair",
  "for_parts",
  "not_applicable",
];

export const priceTypeOptions: Enums["price_type"][] = [
  "fixed",
  "negotiable",
  "starting_from",
  "free",
];

export const listingSorts = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "relevance", label: "Best match" },
];

export const requestSorts = [
  { value: "newest", label: "Newest" },
  { value: "closing_soon", label: "Closing soon" },
  { value: "relevance", label: "Best match" },
];

/**
 * Rate limits, shown on the post forms so the cap is never a surprise.
 *
 * One tier for everyone — §9.3's split between unverified and verified is off
 * for now, so these are purely an abuse ceiling rather than a nudge toward
 * verification. Mirrors the triggers in migration 0009; change both together.
 */
export const caps = {
  /** Active listings at once. */
  listings: 25,
  /** Per rolling 24 hours. */
  requests: 10,
  bids: 40,
  contacts: 60,
  reports: 15,
};

/** The campus this deployment serves. Schema is multi-campus ready (§15). */
export const CAMPUS_SLUG = "kabarak";

export const LISTING_IMAGES_BUCKET = "listing-images";
export const AVATARS_BUCKET = "avatars";
export const VERIFICATION_BUCKET = "verification-docs";
