-- =============================================================================
-- 0002 — Tables, constraints and indexes
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §6.2 – §6.8
-- =============================================================================

-- pg_trgm lives in the `extensions` schema on Supabase; put it on the path so
-- `gin_trgm_ops` resolves while this file runs.
set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- §6.2 Reference tables
-- -----------------------------------------------------------------------------
create table if not exists campuses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  county       text,
  email_domain text,                    -- e.g. 'kabarak.ac.ke', a verification hint
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  icon        text,
  blurb       text,
  sort_order  int not null default 0,
  is_catchall boolean not null default false,   -- true only for 'Others' (§5.5)
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists categories_parent_sort_idx on categories (parent_id, sort_order);

-- Exactly one catch-all category.
create unique index if not exists categories_single_catchall_idx
  on categories ((is_catchall)) where is_catchall;

-- -----------------------------------------------------------------------------
-- §6.3 Profiles
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  campus_id                uuid not null references campuses(id),
  username                 text not null unique
                             check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name                text not null check (char_length(full_name) between 2 and 80),
  avatar_url               text,
  bio                      text check (char_length(bio) <= 300),
  phone_e164               text not null
                             check (phone_e164 ~ '^\+254[17][0-9]{8}$'),
  pickup_area              text,                       -- 'Hostel B', 'Main Gate'
  role                     user_role not null default 'member',
  verification_status      verification_status not null default 'unverified',
  admission_hash           text unique,                -- sha256(admission_number); raw never stored
  verified_at              timestamptz,

  -- denormalised reputation, maintained by trigger (§5.4)
  seller_rating_avg        numeric(3,2) not null default 0,
  seller_rating_count      int not null default 0,
  buyer_rating_avg         numeric(3,2) not null default 0,
  buyer_rating_count       int not null default 0,
  listings_sold_count      int not null default 0,
  requests_fulfilled_count int not null default 0,

  is_suspended             boolean not null default false,
  suspended_until          timestamptz,
  suspension_reason        text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists profiles_campus_idx on profiles (campus_id);
create index if not exists profiles_username_idx on profiles (username);
create index if not exists profiles_role_idx on profiles (role) where role <> 'member';

comment on column profiles.phone_e164 is
  'Never selectable by anon/authenticated (grants are column-scoped in 0006). Only reveal_contact() returns it. §5.3';

-- -----------------------------------------------------------------------------
-- §6.4 Listings
-- -----------------------------------------------------------------------------
create table if not exists listings (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references profiles(id) on delete cascade,
  campus_id      uuid not null references campuses(id),
  category_id    uuid not null references categories(id),

  title          text not null check (char_length(title) between 3 and 80),
  description    text not null check (char_length(description) between 10 and 2000),
  price          numeric(10,2) not null check (price >= 0),
  price_type     price_type not null default 'fixed',
  condition      item_condition not null default 'good',
  pickup_area    text,

  status         listing_status not null default 'active',
  view_count     int not null default 0,
  contact_count  int not null default 0,
  favorite_count int not null default 0,

  expires_at     timestamptz not null default (now() + interval '30 days'),
  sold_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  search_vector  tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B')
  ) stored
);

create index if not exists listings_search_idx on listings using gin (search_vector);
create index if not exists listings_title_trgm_idx on listings using gin (title gin_trgm_ops);
create index if not exists listings_browse_idx on listings (campus_id, status, created_at desc);
create index if not exists listings_category_idx on listings (category_id, status);
create index if not exists listings_seller_idx on listings (seller_id, status);
create index if not exists listings_expiry_idx on listings (expires_at) where status = 'active';

create table if not exists listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  position     int not null default 0 check ("position" between 0 and 5),  -- 1–6 images (§5.1)
  width        int,
  height       int,
  blurhash     text,
  created_at   timestamptz not null default now(),
  unique (listing_id, position)
);
create index if not exists listing_images_listing_idx on listing_images (listing_id, position);

-- -----------------------------------------------------------------------------
-- §6.5 Requests and bids
-- -----------------------------------------------------------------------------
create table if not exists requests (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references profiles(id) on delete cascade,
  campus_id      uuid not null references campuses(id),
  category_id    uuid not null references categories(id),

  title          text not null check (char_length(title) between 3 and 80),
  description    text not null check (char_length(description) between 10 and 1500),
  budget_min     numeric(10,2) check (budget_min >= 0),
  budget_max     numeric(10,2) check (budget_max >= budget_min),
  needed_by      date,

  status         request_status not null default 'open',
  awarded_bid_id uuid,                    -- FK added below, once bids exists
  bid_count      int not null default 0,
  view_count     int not null default 0,

  -- reserved for v2 (group buy / recurring); unused in v1 (§2.3)
  parent_request_id uuid references requests(id) on delete set null,
  recurrence     text,

  expires_at     timestamptz not null default (now() + interval '48 hours'),
  awarded_at     timestamptz,
  closed_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  search_vector  tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B')
  ) stored
);

create index if not exists requests_search_idx on requests using gin (search_vector);
create index if not exists requests_title_trgm_idx on requests using gin (title gin_trgm_ops);
create index if not exists requests_board_idx on requests (campus_id, status, created_at desc);
create index if not exists requests_category_idx on requests (category_id, status);
create index if not exists requests_requester_idx on requests (requester_id);
create index if not exists requests_expiry_idx on requests (expires_at) where status = 'open';

create table if not exists bids (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references requests(id) on delete cascade,
  bidder_id    uuid not null references profiles(id) on delete cascade,

  amount       numeric(10,2) not null check (amount >= 0),
  message      text check (char_length(message) <= 500),
  availability text,                     -- 'today', 'within 2 days'
  listing_id   uuid references listings(id) on delete set null,  -- "I already have this listed"

  status       bid_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (request_id, bidder_id)         -- one bid per user per request (§5.2)
);
create index if not exists bids_request_idx on bids (request_id, status, amount);
create index if not exists bids_bidder_idx on bids (bidder_id, status);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'requests_awarded_bid_fk'
  ) then
    alter table requests
      add constraint requests_awarded_bid_fk
      foreign key (awarded_bid_id) references bids(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- §6.6 Contact events — the transaction proxy
-- -----------------------------------------------------------------------------
create table if not exists contact_events (
  id           uuid primary key default gen_random_uuid(),
  initiator_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  target_type  contact_target not null,
  target_id    uuid not null,
  created_at   timestamptz not null default now(),
  check (initiator_id <> recipient_id)
);
create index if not exists contact_events_initiator_idx on contact_events (initiator_id, created_at desc);
create index if not exists contact_events_recipient_idx on contact_events (recipient_id, created_at desc);
create index if not exists contact_events_target_idx on contact_events (target_type, target_id);
-- Supports the review-eligibility lookup in §6.7 without a sequential scan.
create index if not exists contact_events_pair_idx on contact_events (target_id, initiator_id, recipient_id);

-- -----------------------------------------------------------------------------
-- §6.7 Reviews
-- -----------------------------------------------------------------------------
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  reviewee_id   uuid not null references profiles(id) on delete cascade,
  context_type  review_context not null,
  context_id    uuid not null,                 -- listing_id or request_id
  reviewed_role reviewed_role not null,        -- which hat the reviewee wore
  rating        int not null check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 500),
  created_at    timestamptz not null default now(),

  check (reviewer_id <> reviewee_id),
  unique (reviewer_id, context_type, context_id)   -- one review per party per transaction
);
create index if not exists reviews_reviewee_idx on reviews (reviewee_id, reviewed_role, created_at desc);
create index if not exists reviews_context_idx on reviews (context_type, context_id);

-- -----------------------------------------------------------------------------
-- §6.8 Supporting tables
-- -----------------------------------------------------------------------------
create table if not exists favorites (
  user_id    uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index if not exists favorites_listing_idx on favorites (listing_id);

create table if not exists category_subscriptions (
  user_id     uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);
create index if not exists category_subscriptions_category_idx on category_subscriptions (category_id);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, read_at, created_at desc);

create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references profiles(id) on delete cascade,
  target_type     report_target not null,
  target_id       uuid not null,
  reason          text not null,
  details         text check (char_length(details) <= 1000),
  status          report_status not null default 'open',
  handled_by      uuid references profiles(id),
  handled_at      timestamptz,
  moderator_notes text,
  created_at      timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index if not exists reports_queue_idx on reports (status, created_at);
create index if not exists reports_target_idx on reports (target_type, target_id);

create table if not exists verification_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  admission_hash   text not null,
  id_image_path    text not null,          -- private bucket
  status           verification_status not null default 'pending',
  reviewed_by      uuid references profiles(id),
  reviewed_at      timestamptz,
  rejection_reason text,
  purge_after      timestamptz not null default (now() + interval '30 days'),
  created_at       timestamptz not null default now()
);
create index if not exists verification_requests_status_idx on verification_requests (status, created_at);
create index if not exists verification_requests_user_idx on verification_requests (user_id, created_at desc);
create index if not exists verification_requests_purge_idx on verification_requests (purge_after)
  where id_image_path <> '';
-- One request in flight per user.
create unique index if not exists verification_requests_one_pending_idx
  on verification_requests (user_id) where status = 'pending';

create table if not exists moderation_keywords (
  id        uuid primary key default gen_random_uuid(),
  phrase    text not null unique,
  severity  text not null default 'flag' check (severity in ('flag','block')),
  category  text,                            -- 'academic', 'alcohol', 'weapons'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Keyword pre-screen output (§5.8 mechanism 1). Kept in its own table so the
-- deny-list flags content into the moderator queue without mutating the
-- seller-owned `status` column.
create table if not exists moderation_flags (
  id          uuid primary key default gen_random_uuid(),
  target_type report_target not null,
  target_id   uuid not null,
  owner_id    uuid references profiles(id) on delete cascade,
  phrase      text not null,
  severity    text not null,
  category    text,
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, phrase)
);
create index if not exists moderation_flags_queue_idx on moderation_flags (resolved_at, created_at);

-- Strike ledger for §5.8 mechanism 4 (3 upheld reports in 90 days -> suspension).
create table if not exists strikes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  report_id  uuid references reports(id) on delete set null,
  reason     text,
  created_at timestamptz not null default now(),
  unique (report_id)
);
create index if not exists strikes_user_idx on strikes (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- §6.3 Public projection — omits phone_e164 and suspended accounts.
-- security_invoker keeps the caller's RLS in force through the view.
-- -----------------------------------------------------------------------------
create or replace view profiles_public with (security_invoker = on) as
  select id, campus_id, username, full_name, avatar_url, bio, pickup_area,
         role, verification_status, seller_rating_avg, seller_rating_count,
         buyer_rating_avg, buyer_rating_count, listings_sold_count,
         requests_fulfilled_count, created_at
  from profiles
  where is_suspended = false;
