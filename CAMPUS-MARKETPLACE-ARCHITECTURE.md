# Campus Marketplace — Architecture & Product Specification

> **Working name:** `[TBD]` — placeholder used throughout as `CampusMarket`.
> **Owner:** Ephraim (Build&Host)
> **Status:** Pre-build specification
> **Last updated:** 2026-09-07

---

## 1. Product Summary

A campus-scoped peer-to-peer marketplace where **every account is simultaneously a buyer and a seller**. Two sides of supply discovery:

1. **Listings (push)** — a user posts something they are selling.
2. **Requests (pull)** — a user posts something they need. Other users **bid** on it with a price and message. The requester reviews all bids, awards one, and every other bidder is notified the request is closed.

The platform is **discovery-only**. It does not process payments, hold funds, or act as an escrow. Once a buyer and seller connect, they are handed off to **WhatsApp** and transact directly.

### 1.1 Why discovery-only

Campus transaction values are small (KES 100–2,000 median). Commission on a KES 200 sale, after M-Pesa fees, is not a business. Removing payments:

- Eliminates PSP/CBK regulatory exposure from holding user funds.
- Removes the largest source of build complexity and support load.
- Massively reduces friction to first transaction, which is the only thing that matters pre-liquidity.

The cost is that the platform loses transaction proof. **Section 6.4 (Contact Events)** describes how we recover a usable proxy for that.

### 1.2 What we compete with

Not Jiji or Jumia. The incumbent is the campus WhatsApp buy/sell group. We beat it on exactly three axes, and every feature must serve one of them:

| Axis | WhatsApp weakness | Our answer |
|---|---|---|
| **Search** | Messages buried in minutes; no filtering | Indexed, categorised, filterable catalogue |
| **Trust** | No persistent reputation; scammers re-join under new numbers | Student-verified identity + dual reputation history |
| **Requests** | "WTB" posts scroll away unseen | Persistent request board with structured bidding |

If a proposed feature does not sharpen one of those three, it is out of scope for v1.

---

## 2. Scope

### 2.1 In scope (v1)

- Email/phone auth with student verification
- Dual-role accounts (no separate seller signup)
- Listings with images, categories, price
- Request board with competitive bidding and award flow
- WhatsApp deep-link handoff with contact logging
- Dual reputation (separate buyer and seller scores)
- Full-text search + category/price filters
- In-app notifications with realtime delivery
- Reporting and admin moderation
- Single-campus deployment (multi-campus ready at schema level)

### 2.2 Explicitly out of scope (v1)

- Payments, wallets, escrow, or any custody of funds
- In-app chat (WhatsApp is the messaging layer — do not rebuild it)
- Delivery/logistics coordination
- Native mobile apps (PWA only)
- Group buys, recurring requests, auctions on listings

### 2.3 Deferred but architecturally reserved

Group buy aggregation and recurring requests are strong differentiators but add scope we cannot carry at launch. Schema leaves room (see `requests.parent_request_id`, `requests.recurrence`).

---

## 3. Core Domain Model

```
Profile ──┬─< Listing ──< ListingImage
          │      │
          │      └──< ContactEvent >── Profile (initiator)
          │
          ├─< Request ──< Bid >── Profile (bidder)
          │      │
          │      └── awarded_bid_id ──> Bid
          │
          ├─< Review (as reviewer)
          ├─< Review (as reviewee)
          ├─< Favorite
          ├─< CategorySubscription
          └─< Report
```

### 3.1 The single-account principle

There is **no seller onboarding**. A profile that has never listed anything is not a "buyer account" — it is simply a profile with an empty seller history. This is the core product bet: zero friction to cross the supply threshold.

Consequence: reputation must be **split**, not aggregated. Someone can be a reliable buyer and a terrible seller. A single blended star rating destroys that signal. We store and display two independent scores.

---

## 4. User Roles

| Role | How obtained | Capabilities |
|---|---|---|
| `guest` | Not signed in | Browse listings and requests, view profiles, search. Cannot see contact details, bid, or post. |
| `member` | Signed up, unverified | All guest rights + create listings, post requests, bid, favourite. **Restricted:** max 3 active listings, cannot bid on requests above KES 3,000, contact reveals rate-limited. |
| `verified` | Admission number verified | Full member rights, no caps. Verified badge shown. |
| `moderator` | Assigned | Review reports, hide listings, suspend accounts, verify admissions. |
| `admin` | Assigned | All of the above + category management, feature flags, analytics. |

Roles live in `profiles.role` (enum) plus a boolean `verification_status`. Enforced in RLS, not just in the UI.

### 4.1 Student verification

The single most important trust mechanism. A scammer on this platform can be located in a lecture hall — say that explicitly in onboarding copy, because the deterrent only works if people know about it.

**v1 flow (manual, deliberately):**
1. User submits admission number + uploads student ID photo to a private storage bucket.
2. Moderator reviews in admin panel, approves or rejects.
3. On approval: `verification_status = 'verified'`, badge appears, caps lift.
4. ID photo is deleted from storage 30 days after decision (scheduled job). Only a SHA-256 hash of the admission number is retained, for uniqueness enforcement without storing the raw value.

**Do not build automated verification in v1.** At launch volume, manual review is faster to ship, more accurate, and gives you direct contact with early users.

---

## 5. Feature Specification

### 5.1 Listings

**Fields:** title, description, category, price, price type (fixed / negotiable / starting from / free), condition, images (1–6), pickup area, status.

**Lifecycle:** `draft → active → (reserved) → sold | expired | hidden | removed`

- Listings auto-expire after **30 days** via scheduled job. Seller gets a "renew" notification at day 27. This keeps the catalogue from rotting — the single biggest failure mode of small classifieds sites.
- `reserved` is optional and seller-set: signals "someone's coming to collect" without removing it if the deal falls through.
- `removed` is moderator-only and is distinct from `hidden` (seller-set).

**Images:** compressed client-side before upload (max 1600px long edge, WebP, ~200KB target). This matters enormously on Kenyan mobile data. Uploads go to Supabase Storage, served through `next/image`.

### 5.2 Requests & Bidding — the core mechanic

This is the differentiated surface. Design it carefully.

**Request fields:** title, description, category, budget range (min/max, optional), needed-by date, optional reference images, campus, expiry.

**Bid fields:** amount, message, availability estimate (e.g. "today", "within 2 days"), optional link to an existing listing the bidder already has.

**Rules:**

| Rule | Value | Rationale |
|---|---|---|
| Bid expiry | Request auto-closes after 48h default (requester may set 24h/48h/7d) | Prevents rotting requests; forces decision |
| One bid per user per request | Enforced by unique constraint | Prevents bid spam and price-shaving wars |
| Bid editing | Allowed until awarded | Sellers refine after seeing competition |
| Bid visibility | Amounts visible to all; bidder identity visible to all | Transparency drives competitive pricing. Blind bidding kills the price benefit. |
| Self-bidding | Blocked | `bidder_id <> requester_id` check constraint |
| Withdrawal | Allowed before award; counts toward an abuse metric | |

**Award flow (must be atomic — a single Postgres function):**

```
award_bid(request_id, bid_id):
  1. Verify caller owns the request and request.status = 'open'
  2. Set request.status = 'awarded', request.awarded_bid_id = bid_id
  3. Set winning bid.status = 'accepted'
  4. Set all other bids on the request to 'rejected'
  5. Insert notification for winner: "Your bid was accepted"
  6. Insert notifications for all losers: "This request has been fulfilled"
  7. Insert a contact_event so the requester can reach the winner on WhatsApp
```

Steps 2–7 must run in one transaction. If this is done as sequential client calls, a network drop leaves a request with two accepted bids and no notifications. Implement as a `SECURITY DEFINER` RPC.

**Fulfilment:** after award, the requester marks `fulfilled` or `cancelled`. Only a `fulfilled` request unlocks mutual reviews.

### 5.3 WhatsApp handoff

The transaction layer is WhatsApp. The handoff is the most important conversion event on the platform and the only reliable signal we have.

**Never render a phone number in a page payload.** Phone numbers are excluded from all public reads at the RLS/view level. Revealing contact goes through an RPC:

```
reveal_contact(target_type, target_id) -> { phone, wa_link }
  - requires authenticated caller
  - rate limited (see 9.3)
  - inserts a contact_event row
  - returns E.164 phone + prefilled wa.me deep link
```

**Deep link format:**
```
https://wa.me/254712345678?text=Hi%2C%20I%20saw%20your%20%22Mini%20Fridge%22%20listing%20on%20CampusMarket
```
Prefill the message with the item title. It removes the awkward opening and makes the platform's name travel into WhatsApp — free attribution on every single handoff.

### 5.4 Reputation

Two independent scores on every profile:

- **Seller score** — from buyers, on listings and won bids
- **Buyer score** — from sellers, on purchases and awarded requests

**Anti-fake-review rule:** a review may only be written if a `contact_event` exists linking the two users on that specific listing or request. No contact, no review. This is the discovery-only substitute for verified-purchase and it is the difference between a meaningful ratings system and decoration.

Additional signals shown on profile:
- Join date and verification badge
- Response indicator (contact events received vs. reviews earned) — a rough responsiveness proxy
- Completed request awards
- Total listings sold

Ratings are aggregated by trigger into denormalised columns (`seller_rating_avg`, `seller_rating_count`, `buyer_rating_avg`, `buyer_rating_count`) so profile cards never trigger an aggregate scan.

### 5.5 Categories

Two-level: category → subcategory. Seeded, admin-managed, not user-created.

**Launch set (dense-demand first):**

| Category | Notes |
|---|---|
| Food & Snacks | Home-cooked meals, hostel delivery, baked goods |
| Hostel & Room | Mattresses, kettles, buckets, fans, bedding — **massive at semester open/close** |
| Fashion & Thrift | Clothes, shoes, bags |
| Electronics & Phones | Phones, laptops, accessories, repairs |
| Books & Stationery | Textbooks, notes, printing |
| Services | Braiding, laundry, photography, repairs, design |
| Rentals | Gowns, suits, cameras, calculators |
| **Others** | Catch-all — see below |

**On "Others":** it must exist, or users will mis-file items into wrong categories and pollute search. But it must be **monitored**, not ignored. Build an admin view that lists Others-category items sorted by view count. Anything appearing repeatedly is a category you should promote. Others is a discovery mechanism for your own taxonomy, not a dumping ground.

### 5.6 Search & Discovery

- Postgres full-text search (`tsvector` generated column, GIN index) over title + description, title weighted higher
- `pg_trgm` for fuzzy/typo tolerance on short queries
- Filters: category, price range, condition, verified-seller-only, date posted
- Sorts: newest, price asc/desc, relevance
- Saved searches deferred to v2

Do not reach for an external search service. At campus scale (low tens of thousands of rows) Postgres FTS is faster to ship, cheaper, and entirely adequate.

### 5.7 Notifications

In-app first, delivered over Supabase Realtime; email as fallback for high-value events.

| Event | In-app | Email |
|---|---|---|
| New bid on your request | ✓ | — |
| Your bid was accepted | ✓ | ✓ |
| Request you bid on was closed | ✓ | — |
| New request in a category you follow | ✓ | — |
| Someone revealed your contact | ✓ | — |
| New review received | ✓ | — |
| Listing expiring in 3 days | ✓ | ✓ |
| Moderation action on your content | ✓ | ✓ |

**Category subscriptions** are the growth loop for the request board: sellers follow categories, get pinged the moment a matching request lands, and bid within minutes. Without this, requests sit unanswered and the feature dies. Ship it in v1.

SMS/WhatsApp notification via Africa's Talking is a v2 consideration — cost per message makes it viable only for the accepted-bid event.

### 5.8 Moderation

A campus request board fills with prohibited requests within a week. Assume it. The policy must exist before launch, be visible in the T&Cs, and be enforced consistently — inconsistent enforcement destroys the credibility of the ratings system too.

**Prohibited:**
- Academic dishonesty (assignment writing, exam papers, ghostwriting, proxy attendance)
- Alcohol, tobacco, vapes, controlled substances
- Prescription medication
- Weapons
- Adult/sexual services
- Anything requiring a licence the poster does not hold
- Financial services, lending, "investment opportunities", crypto schemes

**Mechanisms:**
1. **Keyword pre-screen** on submit — a maintained deny-list flags likely violations into a review queue before publication rather than blocking outright (avoids false-positive frustration).
2. **User reporting** on every listing, request, bid, and profile.
3. **Moderator queue** in the admin panel with one-click hide/remove/suspend.
4. **Strike system** — 3 upheld reports within 90 days triggers automatic suspension pending review.

---

## 6. Data Model (Supabase / Postgres)

### 6.0 Required extensions

```sql
create extension if not exists pgcrypto;   -- gen_random_uuid, digest()
create extension if not exists pg_trgm;    -- fuzzy search on short queries
create extension if not exists pg_cron;    -- scheduled expiry/purge jobs
```

### 6.1 Enums

```sql
create type user_role          as enum ('member','moderator','admin');
create type verification_status as enum ('unverified','pending','verified','rejected');
create type listing_status     as enum ('draft','active','reserved','sold','expired','hidden','removed');
create type price_type         as enum ('fixed','negotiable','starting_from','free');
create type item_condition     as enum ('new','like_new','good','fair','for_parts','not_applicable');
create type request_status     as enum ('open','awarded','fulfilled','cancelled','expired');
create type bid_status         as enum ('pending','accepted','rejected','withdrawn','expired');
create type review_context     as enum ('listing','request');
create type reviewed_role      as enum ('seller','buyer');
create type report_target      as enum ('listing','request','bid','profile','review');
create type report_status      as enum ('open','reviewing','actioned','dismissed');
create type contact_target     as enum ('listing','request','bid');
```

### 6.2 Reference tables

```sql
create table campuses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  county      text,
  email_domain text,                    -- e.g. 'kabarak.ac.ke', used as a verification hint
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references categories(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  icon        text,
  sort_order  int  not null default 0,
  is_catchall boolean not null default false,   -- true only for 'Others'
  is_active   boolean not null default true
);
create index on categories (parent_id, sort_order);
```

### 6.3 Profiles

```sql
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  campus_id             uuid not null references campuses(id),
  username              text not null unique
                          check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name             text not null,
  avatar_url            text,
  bio                   text check (char_length(bio) <= 300),
  phone_e164            text not null
                          check (phone_e164 ~ '^\+254[17][0-9]{8}$'),
  pickup_area           text,                       -- 'Hostel B', 'Main Gate'
  role                  user_role not null default 'member',
  verification_status   verification_status not null default 'unverified',
  admission_hash        text unique,                -- sha256(admission_number), raw never stored
  verified_at           timestamptz,

  -- denormalised reputation (maintained by trigger)
  seller_rating_avg     numeric(3,2) not null default 0,
  seller_rating_count   int not null default 0,
  buyer_rating_avg      numeric(3,2) not null default 0,
  buyer_rating_count    int not null default 0,
  listings_sold_count   int not null default 0,
  requests_fulfilled_count int not null default 0,

  is_suspended          boolean not null default false,
  suspended_until       timestamptz,
  suspension_reason     text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on profiles (campus_id);
create index on profiles (username);
```

> **Phone privacy:** `phone_e164` must never appear in a client-side select. Enforced by a public view (`profiles_public`) that omits it, plus column-level revoke. Only `reveal_contact()` returns it.

```sql
create view profiles_public as
  select id, campus_id, username, full_name, avatar_url, bio, pickup_area,
         verification_status, seller_rating_avg, seller_rating_count,
         buyer_rating_avg, buyer_rating_count, listings_sold_count,
         requests_fulfilled_count, created_at
  from profiles
  where is_suspended = false;
```

### 6.4 Listings

```sql
create table listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references profiles(id) on delete cascade,
  campus_id     uuid not null references campuses(id),
  category_id   uuid not null references categories(id),

  title         text not null check (char_length(title) between 3 and 80),
  description   text not null check (char_length(description) between 10 and 2000),
  price         numeric(10,2) not null check (price >= 0),
  price_type    price_type not null default 'fixed',
  condition     item_condition not null default 'good',
  pickup_area   text,

  status        listing_status not null default 'active',
  view_count    int not null default 0,
  contact_count int not null default 0,
  favorite_count int not null default 0,

  expires_at    timestamptz not null default (now() + interval '30 days'),
  sold_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B')
  ) stored
);

create index on listings using gin (search_vector);
create index on listings using gin (title gin_trgm_ops);
create index listings_browse_idx on listings (campus_id, status, created_at desc);
create index on listings (category_id, status);
create index on listings (seller_id, status);
create index on listings (expires_at) where status = 'active';

create table listing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  position    int not null default 0,
  width       int,
  height      int,
  blurhash    text,
  created_at  timestamptz not null default now(),
  unique (listing_id, position)
);
```

### 6.5 Requests & Bids

```sql
create table requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  campus_id     uuid not null references campuses(id),
  category_id   uuid not null references categories(id),

  title         text not null check (char_length(title) between 3 and 80),
  description   text not null check (char_length(description) between 10 and 1500),
  budget_min    numeric(10,2) check (budget_min >= 0),
  budget_max    numeric(10,2) check (budget_max >= budget_min),
  needed_by     date,

  status        request_status not null default 'open',
  awarded_bid_id uuid,                    -- FK added after bids table exists
  bid_count     int not null default 0,
  view_count    int not null default 0,

  -- reserved for v2 (group buy / recurring); unused in v1
  parent_request_id uuid references requests(id) on delete set null,
  recurrence    text,

  expires_at    timestamptz not null default (now() + interval '48 hours'),
  awarded_at    timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B')
  ) stored
);

create index on requests using gin (search_vector);
create index requests_board_idx on requests (campus_id, status, created_at desc);
create index on requests (category_id, status);
create index on requests (requester_id);
create index on requests (expires_at) where status = 'open';

create table bids (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references requests(id) on delete cascade,
  bidder_id     uuid not null references profiles(id) on delete cascade,

  amount        numeric(10,2) not null check (amount >= 0),
  message       text check (char_length(message) <= 500),
  availability  text,                     -- 'today', 'within 2 days'
  listing_id    uuid references listings(id) on delete set null,  -- optional: "I already have this listed"

  status        bid_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (request_id, bidder_id)
);
create index on bids (request_id, status, amount);
create index on bids (bidder_id, status);

alter table requests
  add constraint requests_awarded_bid_fk
  foreign key (awarded_bid_id) references bids(id) on delete set null;
```

**Self-bid prevention** cannot be a simple check constraint (it spans tables), so use a trigger:

```sql
create or replace function prevent_self_bid() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from requests r
    where r.id = new.request_id and r.requester_id = new.bidder_id
  ) then
    raise exception 'You cannot bid on your own request';
  end if;
  return new;
end;
$$;

create trigger bids_no_self_bid
  before insert or update on bids
  for each row execute function prevent_self_bid();
```

### 6.6 Contact Events — the transaction proxy

Because the platform never sees money, `contact_events` is the closest thing to a conversion record. It powers review eligibility, seller responsiveness stats, abuse rate-limiting, and the primary success metric.

```sql
create table contact_events (
  id            uuid primary key default gen_random_uuid(),
  initiator_id  uuid not null references profiles(id) on delete cascade,
  recipient_id  uuid not null references profiles(id) on delete cascade,
  target_type   contact_target not null,
  target_id     uuid not null,
  created_at    timestamptz not null default now(),
  check (initiator_id <> recipient_id)
);
create index on contact_events (initiator_id, created_at desc);
create index on contact_events (recipient_id, created_at desc);
create index on contact_events (target_type, target_id);
```

### 6.7 Reviews

```sql
create table reviews (
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
create index on reviews (reviewee_id, reviewed_role, created_at desc);
```

Review eligibility trigger (the anti-fake-review rule from §5.4):

```sql
create or replace function enforce_review_eligibility() returns trigger
language plpgsql as $$
begin
  if not exists (
    select 1 from contact_events ce
    where ce.target_id = new.context_id
      and ((ce.initiator_id = new.reviewer_id and ce.recipient_id = new.reviewee_id)
        or (ce.initiator_id = new.reviewee_id and ce.recipient_id = new.reviewer_id))
  ) then
    raise exception 'Reviews require a prior contact between the two parties on this item';
  end if;
  return new;
end;
$$;

create trigger reviews_require_contact
  before insert on reviews
  for each row execute function enforce_review_eligibility();
```

### 6.8 Supporting tables

```sql
create table favorites (
  user_id    uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table category_subscriptions (
  user_id     uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table notifications (
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
create index on notifications (user_id, read_at, created_at desc);

create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles(id) on delete cascade,
  target_type  report_target not null,
  target_id    uuid not null,
  reason       text not null,
  details      text,
  status       report_status not null default 'open',
  handled_by   uuid references profiles(id),
  handled_at   timestamptz,
  moderator_notes text,
  created_at   timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index on reports (status, created_at);

create table verification_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  admission_hash text not null,
  id_image_path  text not null,          -- private bucket
  status         verification_status not null default 'pending',
  reviewed_by    uuid references profiles(id),
  reviewed_at    timestamptz,
  rejection_reason text,
  purge_after    timestamptz not null default (now() + interval '30 days'),
  created_at     timestamptz not null default now()
);

create table moderation_keywords (
  id        uuid primary key default gen_random_uuid(),
  phrase    text not null unique,
  severity  text not null default 'flag',   -- 'flag' | 'block'
  category  text,                            -- 'academic', 'alcohol', 'weapons'
  is_active boolean not null default true
);
```

---

## 7. Row Level Security

RLS is the actual security boundary. The Next.js layer is a convenience, not a guard — assume every table is reachable directly with an anon key, because it is.

Enable on every table. `ALTER TABLE` accepts only one table per statement, so loop:

```sql
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','listings','listing_images','requests','bids','reviews',
    'favorites','category_subscriptions','notifications','reports',
    'contact_events','verification_requests','moderation_keywords'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;
```

### 7.1 Helper functions

```sql
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('moderator','admin') from profiles where id = auth.uid()), false);
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not is_suspended from profiles where id = auth.uid()), false);
$$;
```

### 7.2 Representative policies

```sql
-- PROFILES: everyone reads non-suspended profiles; only owner writes
create policy profiles_read on profiles for select
  using (not is_suspended or id = auth.uid() or is_staff());

create policy profiles_update_own on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Prevent privilege escalation: a user must not be able to set their own role
-- or verification status. Enforced with a trigger, since RLS cannot compare
-- old vs new column values in a WITH CHECK clause.
create or replace function guard_profile_privileges() returns trigger
language plpgsql security definer as $$
begin
  if not is_staff() then
    new.role                := old.role;
    new.verification_status := old.verification_status;
    new.is_suspended        := old.is_suspended;
    new.admission_hash      := old.admission_hash;
    new.seller_rating_avg   := old.seller_rating_avg;
    new.seller_rating_count := old.seller_rating_count;
    new.buyer_rating_avg    := old.buyer_rating_avg;
    new.buyer_rating_count  := old.buyer_rating_count;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on profiles
  for each row execute function guard_profile_privileges();

-- LISTINGS: public sees active only; owner sees all their own
create policy listings_read_public on listings for select
  using (status in ('active','reserved') or seller_id = auth.uid() or is_staff());

create policy listings_insert on listings for insert
  with check (seller_id = auth.uid() and is_active_user());

create policy listings_update_own on listings for update
  using (seller_id = auth.uid() or is_staff());

create policy listings_delete_own on listings for delete
  using (seller_id = auth.uid() or is_staff());

-- REQUESTS
create policy requests_read on requests for select
  using (status <> 'cancelled' or requester_id = auth.uid() or is_staff());

create policy requests_insert on requests for insert
  with check (requester_id = auth.uid() and is_active_user());

create policy requests_update_own on requests for update
  using (requester_id = auth.uid() or is_staff());

-- BIDS: transparent by design — anyone can read bids on a visible request
create policy bids_read on bids for select using (true);

create policy bids_insert on bids for insert
  with check (
    bidder_id = auth.uid()
    and is_active_user()
    and exists (
      select 1 from requests r
      where r.id = request_id
        and r.status = 'open'
        and r.expires_at > now()
    )
  );

-- Only the bidder may edit, and only while pending
create policy bids_update_own on bids for update
  using (bidder_id = auth.uid() and status = 'pending')
  with check (bidder_id = auth.uid());

-- CONTACT EVENTS: written only by the reveal_contact RPC; readable by participants
create policy contact_events_read on contact_events for select
  using (initiator_id = auth.uid() or recipient_id = auth.uid() or is_staff());
-- no insert policy: inserts happen via SECURITY DEFINER function only

-- NOTIFICATIONS: strictly own
create policy notifications_read on notifications for select
  using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid());

-- REVIEWS
create policy reviews_read on reviews for select using (true);
create policy reviews_insert on reviews for insert
  with check (reviewer_id = auth.uid() and is_active_user());
```

> **Note on the privilege guard:** it is written as a trigger rather than an RLS `with check`, because RLS policies cannot reference the pre-update row. This is the single most commonly-missed hole in Supabase apps — without it, any user can `PATCH /profiles?id=eq.me` with `{"role":"admin"}`.

---

## 8. Database Functions (RPCs)

All state transitions that touch more than one row go through `SECURITY DEFINER` functions. The client never orchestrates multi-step writes.

| Function | Purpose |
|---|---|
| `award_bid(p_request_id, p_bid_id)` | Atomic award: close request, accept winner, reject others, notify all, create contact event |
| `reveal_contact(p_target_type, p_target_id)` | Rate-limited; logs contact event; returns phone + wa.me link |
| `mark_request_fulfilled(p_request_id)` | Requester confirms completion; unlocks reviews; bumps counters |
| `expire_stale_records()` | Scheduled: expires listings past `expires_at`, closes requests past expiry, notifies owners |
| `recalculate_reputation(p_user_id)` | Recomputes denormalised rating columns (also called by trigger) |
| `purge_verification_artifacts()` | Scheduled: deletes ID images past `purge_after` |
| `search_listings(...)` / `search_requests(...)` | Ranked FTS with filters, returns paginated results |

### 8.1 `award_bid` reference implementation

```sql
create or replace function award_bid(p_request_id uuid, p_bid_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request  requests%rowtype;
  v_bid      bids%rowtype;
  v_loser    record;
begin
  select * into v_request from requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception 'Request not found';
  end if;
  if v_request.requester_id <> auth.uid() then
    raise exception 'Only the requester can award this request';
  end if;
  if v_request.status <> 'open' then
    raise exception 'Request is no longer open';
  end if;

  select * into v_bid from bids
    where id = p_bid_id and request_id = p_request_id and status = 'pending';
  if v_bid.id is null then
    raise exception 'Bid not found or not eligible';
  end if;

  update bids set status = 'accepted', updated_at = now() where id = p_bid_id;
  update bids set status = 'rejected', updated_at = now()
    where request_id = p_request_id and id <> p_bid_id and status = 'pending';

  update requests
     set status = 'awarded',
         awarded_bid_id = p_bid_id,
         awarded_at = now(),
         updated_at = now()
   where id = p_request_id;

  -- notify the winner
  insert into notifications (user_id, type, title, body, link, payload)
  values (v_bid.bidder_id, 'bid_accepted',
          'Your bid was accepted',
          format('%s accepted your bid of KES %s', 
                 (select full_name from profiles where id = v_request.requester_id),
                 v_bid.amount),
          '/requests/' || p_request_id,
          jsonb_build_object('request_id', p_request_id, 'bid_id', p_bid_id));

  -- notify everyone else
  for v_loser in
    select bidder_id from bids
     where request_id = p_request_id and id <> p_bid_id and status = 'rejected'
  loop
    insert into notifications (user_id, type, title, body, link, payload)
    values (v_loser.bidder_id, 'request_closed',
            'Request fulfilled',
            format('"%s" has been awarded to another seller.', v_request.title),
            '/requests/' || p_request_id,
            jsonb_build_object('request_id', p_request_id));
  end loop;

  -- open the contact channel between requester and winner
  insert into contact_events (initiator_id, recipient_id, target_type, target_id)
  values (v_request.requester_id, v_bid.bidder_id, 'bid', p_bid_id)
  on conflict do nothing;
end;
$$;

revoke all on function award_bid(uuid, uuid) from public;
grant execute on function award_bid(uuid, uuid) to authenticated;
```

### 8.2 Scheduling

Use `pg_cron` inside Supabase (preferred — no external dependency, no cold starts):

```sql
select cron.schedule('expire-stale',  '*/15 * * * *', $$ select expire_stale_records(); $$);
select cron.schedule('purge-ids',     '0 3 * * *',    $$ select purge_verification_artifacts(); $$);
```

---

## 9. Application Architecture (Next.js)

### 9.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Rendering | React Server Components by default; Client Components only for interactive islands |
| Mutations | Server Actions |
| Data | Supabase Postgres via `@supabase/ssr` |
| Auth | Supabase Auth (email + OTP; phone OTP optional later) |
| Storage | Supabase Storage (public `listing-images`, private `verification-docs`) |
| Realtime | Supabase Realtime (notifications, live bid counts) |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | react-hook-form + Zod (schemas shared client/server) |
| Email | Resend |
| Hosting | Vercel (app) + Supabase (data) |
| Analytics | Vercel Analytics + custom events into Postgres |

### 9.2 Directory layout

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                    # landing
│   │   └── how-it-works/page.tsx
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/
│   │   ├── layout.tsx                  # shell: nav, notification bell
│   │   ├── browse/
│   │   │   ├── page.tsx                # listing feed + filters
│   │   │   └── [category]/page.tsx
│   │   ├── listings/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── requests/
│   │   │   ├── page.tsx                # the request board
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx           # detail + bid list + award UI
│   │   ├── search/page.tsx
│   │   ├── u/[username]/page.tsx       # public profile
│   │   └── me/
│   │       ├── listings/page.tsx
│   │       ├── requests/page.tsx
│   │       ├── bids/page.tsx
│   │       ├── favorites/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── reviews/page.tsx
│   │       └── settings/page.tsx
│   └── (admin)/admin/
│       ├── reports/page.tsx
│       ├── verifications/page.tsx
│       ├── categories/page.tsx
│       ├── others-watch/page.tsx        # §5.5 taxonomy discovery
│       └── metrics/page.tsx
├── components/
│   ├── ui/                              # shadcn primitives
│   ├── listings/
│   ├── requests/
│   ├── bids/
│   └── shared/
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── actions/{listings,requests,bids,reviews,reports,profile}.ts
│   ├── queries/                         # typed read helpers
│   ├── validation/                      # Zod schemas
│   ├── whatsapp.ts                      # deep-link builder
│   ├── images.ts                        # client compression
│   └── rate-limit.ts
├── types/database.ts                    # generated: supabase gen types
└── middleware.ts                        # session refresh + route guards
```

### 9.3 Rate limiting

Abuse control lives in the database, not in memory — serverless functions share no state.

| Action | Unverified | Verified |
|---|---|---|
| Create listing | 3 active total | 25 active |
| Create request | 2 / day | 10 / day |
| Place bid | 5 / day | 40 / day |
| Reveal contact | 10 / day | 60 / day |
| Submit report | 5 / day | 15 / day |

Implement as a `SECURITY DEFINER` function `check_rate_limit(action, window, cap)` counting rows in the relevant table over the window, called at the top of each RPC and Server Action.

### 9.4 Realtime usage

Subscribe narrowly. Broad subscriptions are the main cause of Realtime cost and client jank.

- `notifications` filtered to `user_id = <me>` — powers the bell badge
- `bids` filtered to `request_id = <current>` — live bid list on an open request detail page only

Everything else is fetched on navigation. Do not subscribe to the listing feed.

---

## 10. Security Checklist

- [ ] RLS enabled on **every** table, verified with an anon-key script that attempts unauthorised reads/writes
- [ ] `guard_profile_privileges` trigger present (blocks self-promotion to admin)
- [ ] `phone_e164` revoked from `anon` and `authenticated`; only exposed via `reveal_contact`
- [ ] All multi-row mutations behind `SECURITY DEFINER` RPCs with explicit `set search_path = public`
- [ ] Service-role key exists only in server-side env; never in a Client Component or `NEXT_PUBLIC_*`
- [ ] Storage policies: `listing-images` public-read but owner-write-only, path-scoped to `{user_id}/`
- [ ] `verification-docs` bucket fully private; signed URLs only, 60s TTL, staff-only
- [ ] Zod validation on every Server Action input, mirrored by DB check constraints
- [ ] Image uploads: MIME sniffing server-side, size cap, EXIF stripped (GPS leakage from hostel photos is a real risk)
- [ ] Rate limits enforced in DB, not client
- [ ] `wa.me` link built server-side from a validated E.164 value — never from user-supplied text
- [ ] Suspended users blocked at RLS via `is_active_user()`, not just hidden in the UI

---

## 11. Monetisation

No commission — there is no transaction to take a cut of. Revenue comes from attention and tooling.

| Stream | Mechanism | Timing |
|---|---|---|
| **Promoted listings** | Pin to top of category/feed for 3 or 7 days, KES 50–150, paid via M-Pesa Till | Once daily actives > ~300 |
| **Seller Pro** | Monthly subscription: higher listing cap, "Pro" badge, bid-first alerts, basic analytics | Post-liquidity |
| **Bid boost** | Highlight a bid on a request | v2 |
| **Local business ads** | Nearby printing shops, salons, eateries — banner or sponsored category | Once traffic is provable |
| **Build&Host white-label** | Deploy the same platform for other campuses/institutions as a paid engagement | Opportunistic |

Payment for these is a simple Buy Goods Till with manual/webhook reconciliation — it does not require the platform to hold user funds and keeps the discovery-only posture intact.

---

## 12. Seasonality

Campus traffic is not smooth. Plan for it explicitly:

| Period | Pattern | Action |
|---|---|---|
| Semester open (weeks 1–2) | Peak: hostel goods, mattresses, kettles, books | Launch here. Pre-seed listings. Push category subscriptions. |
| Mid-semester | Steady baseline: food, services, thrift | Core retention period; measure real engagement here |
| Semester close (final 2 weeks) | Second peak: clearance sell-offs | Run a "Clearance" surface / seasonal category |
| Long holidays | Near-zero | Ship features, no paid acquisition, expect the graph to crater |

Budget runway assuming roughly three dead months a year. Do not read a holiday trough as product failure.

---

## 13. Success Metrics

The vanity metric is signups. Ignore it. Track:

**Primary**
- **Contact events per active user per week** — the closest thing to GMV in a discovery model
- **Request fill rate** — % of requests receiving ≥1 bid within 6 hours
- **Time-to-first-bid** (median) — if this exceeds a few hours, category subscriptions are underperforming

**Secondary**
- Listing → contact conversion rate
- % of users who have both listed and bought (the dual-role thesis, validated or not)
- Repeat contact rate at 30 days
- Review coverage: reviews ÷ eligible contact pairs
- Verified user share

**Health**
- Reports per 1,000 listings
- Median moderation resolution time
- Share of listings landing in "Others"

---

## 14. Build Roadmap

### Phase 0 — Foundation (week 1)
Supabase project, full schema + enums + indexes, RLS on every table, seed campuses and categories, generated TS types, Next.js scaffold with auth and middleware session refresh.

### Phase 1 — Listings (weeks 2–3)
Create/edit/delete listings, image upload with client compression, browse feed with category filter, listing detail page, `reveal_contact` RPC and WhatsApp handoff, favourites.

### Phase 2 — Requests & Bidding (weeks 4–5)
Request board, request creation, bid placement and editing, bid list UI, `award_bid` RPC and award UI, notification fan-out, category subscriptions.

### Phase 3 — Trust (week 6)
Verification submission and admin review, dual reputation with aggregation triggers, review flow gated on contact events, public profile pages.

### Phase 4 — Safety & Ops (week 7)
Reporting, moderator queue, keyword pre-screen, strike system, suspension enforcement, `expire_stale_records` scheduled job, admin metrics.

### Phase 5 — Polish & Launch (week 8)
Full-text search with filters, PWA manifest and install prompt, empty states, onboarding copy, seed content, T&Cs and prohibited-items policy, performance pass on mobile.

### v2 candidates (do not build now)
Group buy aggregation · recurring requests · saved searches · SMS alerts via Africa's Talking · multi-campus rollout · optional escrow on high-value items.

---

## 15. Open Decisions

1. **Product name and domain** — still unresolved. Needed before verification copy and WhatsApp prefill text are finalised.
2. **Single-campus deep vs multi-campus wide.** Schema is multi-campus ready, but the go-to-market is fundamentally different. Each new campus is a cold-start liquidity problem from zero, not a marginal expansion. Recommendation: prove Kabarak completely before touching Egerton or the Nakuru colleges.
3. **Bid transparency.** Spec assumes fully open bids. Open bidding drives prices down and looks fair; it also lets a competitor undercut by KES 10 with no effort. Consider testing amount-visible/identity-hidden as a variant.
4. **Verification as a hard gate?** Currently soft (caps, not a wall). If early fraud appears, hardening verification into a requirement for bidding is the first lever to pull.
5. **Contact reveal and phone privacy.** Once revealed, a phone number is out of your control. Consider a per-listing masked number in v2 if abuse warrants the cost.
6. **Prohibited-items enforcement posture.** Academic dishonesty requests will be the most common violation and the most socially normalised. Decide now whether you are removing them or looking away — half-enforcement is worse than either.

---

## 16. Notes for Claude Code

When building this with Claude Code, keep to the established discipline:

- Maintain `CLAUDE.md`, `PROGRESS.md`, `API.md` alongside this document.
- One file per prompt. Scope changes tightly.
- Safety prefix: list every planned file change before executing.
- Build the schema and RLS **first and completely**. Retrofitting RLS onto a working app is where Supabase projects die.
- Generate types after every migration: `supabase gen types typescript --local > src/types/database.ts`.
- Write the anon-key RLS probe script in Phase 0 and run it after every migration.
