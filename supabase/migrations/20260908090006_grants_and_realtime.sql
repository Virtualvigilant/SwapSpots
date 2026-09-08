-- =============================================================================
-- 0006 — Privileges and Realtime
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §5.3, §9.4, §10
--
-- Supabase's default privileges hand `anon` and `authenticated` ALL on every
-- new table in `public`. That is too wide, and it is what makes the §10
-- requirement "phone_e164 revoked from anon and authenticated" impossible:
-- a table-level SELECT grant implies every column, and you cannot revoke a
-- single column out from under it. So: revoke wholesale, then re-grant
-- exactly what each role needs, with profiles granted column by column.
-- =============================================================================

set search_path = public;

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to service_role;

-- Reference data
grant select on campuses, categories to anon, authenticated;
grant insert, update, delete on campuses, categories to authenticated;

-- -----------------------------------------------------------------------------
-- PROFILES — phone_e164 is absent from every grant below. It is readable only
-- inside reveal_contact(), which runs as owner. (§5.3)
-- admission_hash is withheld too: the format is guessable, so a readable hash
-- is a lookup table waiting to happen.
-- -----------------------------------------------------------------------------
grant select (
  id, campus_id, username, full_name, avatar_url, bio, pickup_area, role,
  verification_status, verified_at, seller_rating_avg, seller_rating_count,
  buyer_rating_avg, buyer_rating_count, listings_sold_count,
  requests_fulfilled_count, is_suspended, suspended_until, suspension_reason,
  created_at, updated_at
) on profiles to anon, authenticated;

grant insert (
  id, campus_id, username, full_name, avatar_url, bio, phone_e164, pickup_area
) on profiles to authenticated;

-- The staff-only columns are granted here but gated by guard_profile_privileges()
-- in 0003, which silently restores them for anyone who is not a moderator.
grant update (
  username, full_name, avatar_url, bio, phone_e164, pickup_area,
  role, verification_status, verified_at,
  is_suspended, suspended_until, suspension_reason, updated_at
) on profiles to authenticated;

grant select on profiles_public to anon, authenticated;

-- Catalogue
grant select on listings, listing_images, requests, bids, reviews to anon, authenticated;
grant insert, update, delete on listings, listing_images, requests to authenticated;
grant insert, update, delete on bids to authenticated;
grant insert, delete on reviews to authenticated;

-- Private to the participants
grant select on contact_events to authenticated;
grant select, insert, delete on favorites, category_subscriptions to authenticated;
grant select, update, delete on notifications to authenticated;

-- Moderation
grant select, insert, update on reports to authenticated;
grant select, insert, update on verification_requests to authenticated;
grant select, insert, update, delete on moderation_keywords to authenticated;
grant select, update on moderation_flags to authenticated;
grant select on strikes to authenticated;

-- -----------------------------------------------------------------------------
-- Function privileges. Every RPC is explicit: nothing is executable by PUBLIC.
-- -----------------------------------------------------------------------------
do $$
declare
  fn text;
  auth_only text[] := array[
    'complete_onboarding(text,text,text,text,text)',
    'award_bid(uuid,uuid)',
    'reveal_contact(contact_target,uuid)',
    'mark_request_fulfilled(uuid)',
    'cancel_request(uuid,text)',
    'submit_verification(text,text)',
    'review_verification(uuid,boolean,text)',
    'resolve_report(uuid,report_status,text)',
    'mark_notifications_read(uuid[])'
  ];
  public_read text[] := array[
    'search_listings(text,text,text,numeric,numeric,item_condition[],boolean,text,int,int)',
    'search_requests(text,text,text,boolean,text,int,int)',
    'bump_view_count(contact_target,uuid)'
  ];
  -- Called from inside RLS policy expressions, which are evaluated as the
  -- querying role -- so the client roles genuinely need EXECUTE here. Each one
  -- only reports on auth.uid() itself, so this leaks nothing.
  policy_helpers text[] := array[
    'auth_role()', 'is_staff()', 'is_admin()', 'is_active_user()'
  ];
  -- Only ever called from inside SECURITY DEFINER code, which runs as the
  -- owner, so no client grant is needed.
  internal text[] := array[
    'is_verified(uuid)', 'admission_digest(text)', 'recalculate_reputation(uuid)',
    'report_target_owner(report_target,uuid)', 'screen_text(text)',
    'expire_stale_records()', 'purge_verification_artifacts()'
  ];
begin
  foreach fn in array auth_only loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;

  foreach fn in array public_read loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', fn);
  end loop;

  foreach fn in array policy_helpers loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to anon, authenticated, service_role', fn);
  end loop;

  foreach fn in array internal loop
    execute format('revoke all on function public.%s from public, anon, authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- §9.4 Realtime. Subscribe narrowly on the client:
--   notifications  filtered to user_id = <me>      -> the bell badge
--   bids           filtered to request_id = <one>  -> live bid list, open
--                                                     request detail page only
-- Do not subscribe to the listing feed.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bids'
    ) then
      alter publication supabase_realtime add table public.bids;
    end if;
  end if;
end $$;
