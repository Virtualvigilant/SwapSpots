-- =============================================================================
-- 0003 — Domain functions and triggers
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §5.2, §5.4, §5.8, §6.5, §6.7, §7.1, §9.3
--
-- Anything that writes a row the caller does not own is SECURITY DEFINER. The
-- functions are owned by `postgres`, which owns these tables, so they run past
-- RLS — see the note at the top of 0004 on why FORCE ROW LEVEL SECURITY is
-- deliberately not used.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- §7.1 Helpers
-- -----------------------------------------------------------------------------
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('moderator','admin') from profiles where id = auth.uid()), false);
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not is_suspended from profiles where id = auth.uid()), false);
$$;

create or replace function is_verified(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select verification_status = 'verified' from profiles where id = p_user), false);
$$;

-- sha256 of an admission number. The raw value is never stored (§4.1).
create or replace function admission_digest(p_admission text) returns text
language sql immutable as $$
  select encode(sha256(convert_to(upper(trim(p_admission)), 'UTF8')), 'hex');
$$;

-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','listings','requests','bids'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- §7.2 Privilege guard — without this, any user can PATCH their own row with
-- {"role":"admin"}. RLS cannot compare OLD to NEW, so it has to be a trigger.
-- -----------------------------------------------------------------------------
create or replace function guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then
    new.id                       := old.id;
    new.role                     := old.role;
    new.verification_status      := old.verification_status;
    new.verified_at              := old.verified_at;
    new.is_suspended             := old.is_suspended;
    new.suspended_until          := old.suspended_until;
    new.suspension_reason        := old.suspension_reason;
    new.admission_hash           := old.admission_hash;
    new.campus_id                := old.campus_id;
    new.seller_rating_avg        := old.seller_rating_avg;
    new.seller_rating_count      := old.seller_rating_count;
    new.buyer_rating_avg         := old.buyer_rating_avg;
    new.buyer_rating_count       := old.buyer_rating_count;
    new.listings_sold_count      := old.listings_sold_count;
    new.requests_fulfilled_count := old.requests_fulfilled_count;
    new.created_at               := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before update on profiles
  for each row execute function guard_profile_privileges();

-- -----------------------------------------------------------------------------
-- Profile bootstrap. Supabase Auth creates the auth.users row; this mirrors it
-- into profiles when signup metadata carries the required fields. When it does
-- not (OAuth, magic link), the app finishes onboarding via complete_onboarding().
-- -----------------------------------------------------------------------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  v_username  text := nullif(trim(lower(new.raw_user_meta_data->>'username')), '');
  v_full_name text := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
  v_phone     text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone_e164', new.phone)), '');
  v_campus    uuid;
begin
  if v_username is null or v_full_name is null or v_phone is null then
    return new;
  end if;

  select id into v_campus from campuses
   where slug = nullif(new.raw_user_meta_data->>'campus_slug', '');
  if v_campus is null then
    select id into v_campus from campuses where is_active order by created_at limit 1;
  end if;
  if v_campus is null then
    return new;   -- no campus seeded yet; let onboarding handle it
  end if;

  insert into profiles (id, campus_id, username, full_name, phone_e164, pickup_area)
  values (new.id, v_campus, v_username, v_full_name, v_phone,
          nullif(trim(new.raw_user_meta_data->>'pickup_area'), ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- §6.5 Self-bid prevention — spans two tables, so it cannot be a check constraint
-- -----------------------------------------------------------------------------
create or replace function prevent_self_bid() returns trigger
language plpgsql security definer set search_path = public as $$
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

drop trigger if exists bids_no_self_bid on bids;
create trigger bids_no_self_bid before insert or update on bids
  for each row execute function prevent_self_bid();

-- -----------------------------------------------------------------------------
-- §5.4 / §6.7 Anti-fake-review rule: no contact event, no review
-- -----------------------------------------------------------------------------
create or replace function enforce_review_eligibility() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_request requests%rowtype;
  v_winner  uuid;
  v_seller  uuid;
begin
  if new.context_type = 'request' then
    select * into v_request from requests where id = new.context_id;
    if v_request.id is null then
      raise exception 'Request not found';
    end if;
    -- §5.2: only a fulfilled request unlocks mutual reviews
    if v_request.status <> 'fulfilled' then
      raise exception 'Reviews open once the requester marks the request fulfilled';
    end if;

    select bidder_id into v_winner from bids where id = v_request.awarded_bid_id;
    if v_winner is null then
      raise exception 'This request has no awarded bid';
    end if;

    if not ((new.reviewer_id = v_request.requester_id and new.reviewee_id = v_winner)
         or (new.reviewer_id = v_winner and new.reviewee_id = v_request.requester_id)) then
      raise exception 'Only the requester and the awarded seller can review each other';
    end if;

    -- the requester wore the buyer hat, the winning bidder the seller hat
    if (new.reviewee_id = v_winner and new.reviewed_role <> 'seller')
    or (new.reviewee_id = v_request.requester_id and new.reviewed_role <> 'buyer') then
      raise exception 'reviewed_role does not match this transaction';
    end if;

    -- award_bid() already logged the contact event, against the bid id
    return new;
  end if;

  -- Listing context. §5.4 anti-fake-review rule: no contact, no review. This is
  -- the discovery-only stand-in for verified-purchase, and it is the whole
  -- difference between a ratings system and decoration.
  select seller_id into v_seller from listings where id = new.context_id;
  if v_seller is null then
    raise exception 'Listing not found';
  end if;
  if v_seller not in (new.reviewer_id, new.reviewee_id) then
    raise exception 'Only the seller and the buyer can review each other on a listing';
  end if;
  if (new.reviewee_id = v_seller and new.reviewed_role <> 'seller')
  or (new.reviewee_id <> v_seller and new.reviewed_role <> 'buyer') then
    raise exception 'reviewed_role does not match this transaction';
  end if;

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

drop trigger if exists reviews_require_contact on reviews;
create trigger reviews_require_contact before insert on reviews
  for each row execute function enforce_review_eligibility();

-- -----------------------------------------------------------------------------
-- §5.4 Dual reputation — denormalised so profile cards never scan reviews
-- -----------------------------------------------------------------------------
create or replace function recalculate_reputation(p_user_id uuid) returns void
language sql security definer set search_path = public as $$
  update profiles p set
    seller_rating_avg   = coalesce((select round(avg(rating), 2) from reviews r
                                     where r.reviewee_id = p.id and r.reviewed_role = 'seller'), 0),
    seller_rating_count = (select count(*) from reviews r
                            where r.reviewee_id = p.id and r.reviewed_role = 'seller'),
    buyer_rating_avg    = coalesce((select round(avg(rating), 2) from reviews r
                                     where r.reviewee_id = p.id and r.reviewed_role = 'buyer'), 0),
    buyer_rating_count  = (select count(*) from reviews r
                            where r.reviewee_id = p.id and r.reviewed_role = 'buyer')
  where p.id = p_user_id;
$$;

create or replace function sync_reputation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT','UPDATE') then
    perform recalculate_reputation(new.reviewee_id);
  end if;
  if tg_op in ('UPDATE','DELETE') then
    perform recalculate_reputation(old.reviewee_id);
  end if;
  return null;
end;
$$;

drop trigger if exists reviews_sync_reputation on reviews;
create trigger reviews_sync_reputation after insert or update or delete on reviews
  for each row execute function sync_reputation();

-- Notify the reviewee (§5.7)
create or replace function notify_new_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, title, body, link, payload)
  select new.reviewee_id, 'review_received', 'You received a review',
         format('%s left you a %s-star review.',
                coalesce(pr.full_name, 'Someone'), new.rating),
         '/u/' || pr2.username,
         jsonb_build_object('review_id', new.id, 'rating', new.rating,
                            'context_type', new.context_type, 'context_id', new.context_id)
    from profiles pr, profiles pr2
   where pr.id = new.reviewer_id and pr2.id = new.reviewee_id;
  return null;
end;
$$;

drop trigger if exists reviews_notify on reviews;
create trigger reviews_notify after insert on reviews
  for each row execute function notify_new_review();

-- -----------------------------------------------------------------------------
-- Denormalised counters
-- -----------------------------------------------------------------------------
create or replace function sync_request_bid_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_request uuid;
begin
  if tg_op = 'DELETE' then v_request := old.request_id; else v_request := new.request_id; end if;

  update requests r
     set bid_count = (select count(*) from bids b
                       where b.request_id = v_request and b.status <> 'withdrawn')
   where r.id = v_request;
  return null;
end;
$$;

drop trigger if exists bids_sync_count on bids;
create trigger bids_sync_count after insert or update or delete on bids
  for each row execute function sync_request_bid_count();

create or replace function sync_listing_favorite_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_listing uuid;
begin
  if tg_op = 'DELETE' then v_listing := old.listing_id; else v_listing := new.listing_id; end if;

  update listings l
     set favorite_count = (select count(*) from favorites f where f.listing_id = v_listing)
   where l.id = v_listing;
  return null;
end;
$$;

drop trigger if exists favorites_sync_count on favorites;
create trigger favorites_sync_count after insert or delete on favorites
  for each row execute function sync_listing_favorite_count();

create or replace function sync_contact_counters() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.target_type = 'listing' then
    update listings set contact_count = contact_count + 1 where id = new.target_id;
  end if;
  return null;
end;
$$;

drop trigger if exists contact_events_sync_counters on contact_events;
create trigger contact_events_sync_counters after insert on contact_events
  for each row execute function sync_contact_counters();

create or replace function sync_listing_sold() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at := coalesce(new.sold_at, now());
  elsif new.status <> 'sold' then
    new.sold_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_mark_sold on listings;
create trigger listings_mark_sold before update of status on listings
  for each row execute function sync_listing_sold();

create or replace function sync_listings_sold_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_seller uuid;
begin
  if tg_op = 'DELETE' then v_seller := old.seller_id; else v_seller := new.seller_id; end if;

  update profiles p
     set listings_sold_count = (select count(*) from listings l
                                 where l.seller_id = v_seller and l.status = 'sold')
   where p.id = v_seller;
  return null;
end;
$$;

drop trigger if exists listings_sync_sold_count on listings;
create trigger listings_sync_sold_count after insert or update of status or delete on listings
  for each row execute function sync_listings_sold_count();

-- -----------------------------------------------------------------------------
-- §5.7 Notification fan-out on the two events that are pure inserts.
-- (award_bid and reveal_contact do their own — see 0005.)
-- -----------------------------------------------------------------------------
create or replace function notify_new_bid() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_request requests%rowtype;
begin
  select * into v_request from requests where id = new.request_id;
  if v_request.id is null then return null; end if;

  insert into notifications (user_id, type, title, body, link, payload)
  values (v_request.requester_id, 'new_bid', 'New bid on your request',
          format('%s bid KES %s on "%s".',
                 (select full_name from profiles where id = new.bidder_id),
                 trim(to_char(new.amount, 'FM999,999,990')),
                 v_request.title),
          '/requests/' || new.request_id,
          jsonb_build_object('request_id', new.request_id, 'bid_id', new.id,
                             'amount', new.amount));
  return null;
end;
$$;

drop trigger if exists bids_notify_requester on bids;
create trigger bids_notify_requester after insert on bids
  for each row execute function notify_new_bid();

-- Category subscriptions are the growth loop for the request board (§5.7).
create or replace function notify_category_subscribers() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, type, title, body, link, payload)
  select cs.user_id, 'new_request_in_category',
         'New request in ' || c.name,
         format('"%s" — someone is looking for this.', new.title),
         '/requests/' || new.id,
         jsonb_build_object('request_id', new.id, 'category_id', new.category_id)
    from category_subscriptions cs
    join categories c on c.id = cs.category_id
    join profiles p on p.id = cs.user_id
   where cs.category_id = new.category_id
     and cs.user_id <> new.requester_id
     and p.is_suspended = false
     and p.campus_id = new.campus_id;
  return null;
end;
$$;

drop trigger if exists requests_notify_subscribers on requests;
create trigger requests_notify_subscribers after insert on requests
  for each row execute function notify_category_subscribers();

-- -----------------------------------------------------------------------------
-- §9.3 Rate limits. Enforced in the database because serverless functions
-- share no memory. Caps are keyed off the row owner, not auth.uid(), so they
-- still hold when a SECURITY DEFINER function writes on a user's behalf.
-- -----------------------------------------------------------------------------
create or replace function enforce_listing_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_active int;
begin
  if is_staff() then return new; end if;
  if new.status not in ('active','reserved') then return new; end if;

  v_cap := case when is_verified(new.seller_id) then 25 else 3 end;
  select count(*) into v_active from listings
   where seller_id = new.seller_id and status in ('active','reserved') and id <> new.id;

  if v_active >= v_cap then
    raise exception 'Listing cap reached (% active). Verify your student ID to raise it.', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_rate_limit on listings;
create trigger listings_rate_limit before insert or update of status on listings
  for each row execute function enforce_listing_cap();

create or replace function enforce_request_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_today int;
begin
  if is_staff() then return new; end if;
  v_cap := case when is_verified(new.requester_id) then 10 else 2 end;
  select count(*) into v_today from requests
   where requester_id = new.requester_id and created_at > now() - interval '24 hours';
  if v_today >= v_cap then
    raise exception 'Daily request limit reached (% per day).', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists requests_rate_limit on requests;
create trigger requests_rate_limit before insert on requests
  for each row execute function enforce_request_cap();

create or replace function enforce_bid_rules() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_today int; v_verified boolean;
begin
  v_verified := is_verified(new.bidder_id);

  -- §4: unverified members cannot bid above KES 3,000
  if not v_verified and not is_staff() and new.amount > 3000 then
    raise exception 'Verify your student ID to bid above KES 3,000'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' and not is_staff() then
    v_cap := case when v_verified then 40 else 5 end;
    select count(*) into v_today from bids
     where bidder_id = new.bidder_id and created_at > now() - interval '24 hours';
    if v_today >= v_cap then
      raise exception 'Daily bid limit reached (% per day).', v_cap
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bids_rate_limit on bids;
create trigger bids_rate_limit before insert or update of amount on bids
  for each row execute function enforce_bid_rules();

create or replace function enforce_report_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_today int;
begin
  if is_staff() then return new; end if;
  v_cap := case when is_verified(new.reporter_id) then 15 else 5 end;
  select count(*) into v_today from reports
   where reporter_id = new.reporter_id and created_at > now() - interval '24 hours';
  if v_today >= v_cap then
    raise exception 'Daily report limit reached (% per day).', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_rate_limit on reports;
create trigger reports_rate_limit before insert on reports
  for each row execute function enforce_report_cap();

-- -----------------------------------------------------------------------------
-- §5.8 Keyword pre-screen. `block` refuses the write; `flag` lets it publish
-- and drops it into the moderator queue, which is the stated posture — a
-- deny-list that blocks outright generates false-positive frustration.
-- -----------------------------------------------------------------------------
create or replace function screen_text(p_text text)
returns table (phrase text, severity text, category text)
language sql stable security definer set search_path = public as $$
  select k.phrase, k.severity, k.category
    from moderation_keywords k
   where k.is_active
     and p_text ilike '%' || k.phrase || '%';
$$;

create or replace function screen_content() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  -- This trigger is shared by listings and requests, whose row types differ.
  -- Going through jsonb keeps one function instead of two near-identical ones.
  v_row   jsonb := to_jsonb(new);
  v_text  text  := coalesce(v_row->>'title','') || ' ' || coalesce(v_row->>'description','');
  v_id    uuid  := (v_row->>'id')::uuid;
  v_owner uuid;
  v_type  report_target;
  v_hit   record;
begin
  if tg_table_name = 'listings' then
    v_owner := (v_row->>'seller_id')::uuid;
    v_type  := 'listing';
  else
    v_owner := (v_row->>'requester_id')::uuid;
    v_type  := 'request';
  end if;

  for v_hit in select * from screen_text(v_text) loop
    if v_hit.severity = 'block' then
      raise exception 'This post looks like it breaks the prohibited-items policy (%). Please review /prohibited-items.',
        coalesce(v_hit.category, 'policy')
        using errcode = 'check_violation';
    end if;
    insert into moderation_flags (target_type, target_id, owner_id, phrase, severity, category)
    values (v_type, v_id, v_owner, v_hit.phrase, v_hit.severity, v_hit.category)
    on conflict (target_type, target_id, phrase) do nothing;
  end loop;
  return null;
end;
$$;

drop trigger if exists listings_screen on listings;
create trigger listings_screen after insert or update of title, description on listings
  for each row execute function screen_content();

drop trigger if exists requests_screen on requests;
create trigger requests_screen after insert or update of title, description on requests
  for each row execute function screen_content();
