-- =============================================================================
-- 0001 — Extensions and enums
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §6.0, §6.1
-- =============================================================================

-- Supabase keeps extensions out of `public`. gen_random_uuid() and sha256() are
-- core in PG13+/PG11+ respectively, so pgcrypto is only here for parity with the
-- spec; pg_trgm is the one we actually depend on (§5.6 fuzzy search).
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums (§6.1)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('member','moderator','admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('unverified','pending','verified','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_status') then
    create type listing_status as enum ('draft','active','reserved','sold','expired','hidden','removed');
  end if;
  if not exists (select 1 from pg_type where typname = 'price_type') then
    create type price_type as enum ('fixed','negotiable','starting_from','free');
  end if;
  if not exists (select 1 from pg_type where typname = 'item_condition') then
    create type item_condition as enum ('new','like_new','good','fair','for_parts','not_applicable');
  end if;
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum ('open','awarded','fulfilled','cancelled','expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'bid_status') then
    create type bid_status as enum ('pending','accepted','rejected','withdrawn','expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_context') then
    create type review_context as enum ('listing','request');
  end if;
  if not exists (select 1 from pg_type where typname = 'reviewed_role') then
    create type reviewed_role as enum ('seller','buyer');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_target') then
    create type report_target as enum ('listing','request','bid','profile','review');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type report_status as enum ('open','reviewing','actioned','dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'contact_target') then
    create type contact_target as enum ('listing','request','bid');
  end if;
end $$;
