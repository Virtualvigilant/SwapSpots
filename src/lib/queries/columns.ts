/**
 * `select("*")` on `profiles` fails: `phone_e164` and `admission_hash` are not
 * in the grant for `anon`/`authenticated` (§5.3), and PostgREST expands the
 * star to every column including those. Every profile read therefore names its
 * columns, and they are named here once.
 */
export const PROFILE_CARD = [
  "id",
  "username",
  "full_name",
  "avatar_url",
  "verification_status",
  "seller_rating_avg",
  "seller_rating_count",
  "buyer_rating_avg",
  "buyer_rating_count",
].join(",");

export const PROFILE_FULL = [
  PROFILE_CARD,
  "campus_id",
  "bio",
  "pickup_area",
  "role",
  "verified_at",
  "listings_sold_count",
  "requests_fulfilled_count",
  "is_suspended",
  "suspended_until",
  "suspension_reason",
  "created_at",
  "updated_at",
].join(",");
