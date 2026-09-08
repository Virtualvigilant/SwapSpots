-- =============================================================================
-- 0005 — Database functions (RPCs)
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §8
--
-- Every state transition touching more than one row lives here. The client
-- never orchestrates a multi-step write.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Onboarding — used when signup metadata did not carry the profile fields
-- (OAuth / magic link), so handle_new_user() could not create the row.
-- -----------------------------------------------------------------------------
create or replace function complete_onboarding(
  p_username    text,
  p_full_name   text,
  p_phone_e164  text,
  p_campus_slug text default null,
  p_pickup_area text default null
) returns profiles
language plpgsql security definer set search_path = public as $$
declare
  v_campus uuid;
  v_row    profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  select id into v_campus from campuses where slug = p_campus_slug and is_active;
  if v_campus is null then
    select id into v_campus from campuses where is_active order by created_at limit 1;
  end if;
  if v_campus is null then
    raise exception 'No active campus configured';
  end if;

  insert into profiles (id, campus_id, username, full_name, phone_e164, pickup_area)
  values (auth.uid(), v_campus, lower(trim(p_username)), trim(p_full_name),
          trim(p_phone_e164), nullif(trim(p_pickup_area), ''))
  on conflict (id) do update
    set username    = excluded.username,
        full_name   = excluded.full_name,
        phone_e164  = excluded.phone_e164,
        pickup_area = excluded.pickup_area
  returning * into v_row;

  return v_row;
end;
$$;

-- -----------------------------------------------------------------------------
-- §8.1 award_bid — the atomic award. Steps 2–7 in one transaction; done as
-- sequential client calls, a dropped connection leaves a request with two
-- accepted bids and nobody notified.
-- -----------------------------------------------------------------------------
create or replace function award_bid(p_request_id uuid, p_bid_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request requests%rowtype;
  v_bid     bids%rowtype;
  v_loser   record;
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
     set status         = 'awarded',
         awarded_bid_id = p_bid_id,
         awarded_at     = now(),
         updated_at     = now()
   where id = p_request_id;

  -- the winner
  insert into notifications (user_id, type, title, body, link, payload)
  values (v_bid.bidder_id, 'bid_accepted',
          'Your bid was accepted',
          format('%s accepted your bid of KES %s',
                 (select full_name from profiles where id = v_request.requester_id),
                 trim(to_char(v_bid.amount, 'FM999,999,990'))),
          '/requests/' || p_request_id,
          jsonb_build_object('request_id', p_request_id, 'bid_id', p_bid_id));

  -- everyone else
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
  values (v_request.requester_id, v_bid.bidder_id, 'bid', p_bid_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- §5.3 reveal_contact — the only path to a phone number. Rate limited, logged,
-- and it builds the wa.me link server-side from the validated E.164 column so
-- no user-supplied text ever reaches the URL.
-- -----------------------------------------------------------------------------
create or replace function reveal_contact(p_target_type contact_target, p_target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me        uuid := auth.uid();
  v_recipient uuid;
  v_label     text;
  v_phone     text;
  v_name      text;
  v_cap       int;
  v_used      int;
  v_link      text;
begin
  if v_me is null then
    raise exception 'Sign in to reveal contact details';
  end if;
  if not is_active_user() then
    raise exception 'Your account is suspended';
  end if;

  case p_target_type
    when 'listing' then
      select l.seller_id, l.title into v_recipient, v_label
        from listings l
       where l.id = p_target_id and l.status in ('active','reserved');
    when 'request' then
      select r.requester_id, r.title into v_recipient, v_label
        from requests r
       where r.id = p_target_id and r.status in ('open','awarded');
    when 'bid' then
      select b.bidder_id, r.title into v_recipient, v_label
        from bids b join requests r on r.id = b.request_id
       where b.id = p_target_id
         and (r.requester_id = v_me or b.bidder_id = v_me);
  end case;

  if v_recipient is null then
    raise exception 'Nothing to contact here';
  end if;
  if v_recipient = v_me then
    raise exception 'That is your own listing';
  end if;

  -- §9.3: 10/day unverified, 60/day verified, counted on distinct targets so
  -- re-opening the same page does not burn the quota.
  v_cap := case when is_verified(v_me) then 60 else 10 end;
  select count(distinct target_id) into v_used
    from contact_events
   where initiator_id = v_me and created_at > now() - interval '24 hours';

  if v_used >= v_cap and not exists (
    select 1 from contact_events
     where initiator_id = v_me and target_id = p_target_id
       and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Daily contact limit reached (% per day). Verify your student ID to raise it.', v_cap
      using errcode = 'check_violation';
  end if;

  select phone_e164, full_name into v_phone, v_name
    from profiles where id = v_recipient and not is_suspended;
  if v_phone is null then
    raise exception 'This user is not reachable';
  end if;

  insert into contact_events (initiator_id, recipient_id, target_type, target_id)
  values (v_me, v_recipient, p_target_type, p_target_id);

  insert into notifications (user_id, type, title, body, link, payload)
  values (v_recipient, 'contact_revealed', 'Someone wants to reach you',
          format('%s opened your contact for "%s".',
                 (select full_name from profiles where id = v_me), v_label),
          case p_target_type
            when 'listing' then '/listings/' || p_target_id
            else '/requests/' || p_target_id
          end,
          jsonb_build_object('target_type', p_target_type, 'target_id', p_target_id));

  -- wa.me wants the E.164 digits with no leading '+'
  -- §5.3: prefill with the item title. It removes the awkward opening and
  -- carries the platform name into WhatsApp on every handoff.
  v_link := 'https://wa.me/' || ltrim(v_phone, '+')
            || '?text=' || replace(
                 replace(
                   replace(
                     replace(
                       format('Hi, I saw your "%s" %s on SwapSpot', v_label,
                              case p_target_type when 'listing' then 'listing'
                                                 else 'request' end),
                       ' ', '%20'),
                     '"', '%22'),
                   ',', '%2C'),
                 '&', '%26');

  return jsonb_build_object(
    'phone', v_phone,
    'wa_link', v_link,
    'recipient_id', v_recipient,
    'recipient_name', v_name
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- §5.2 Fulfilment — only a fulfilled request unlocks mutual reviews
-- -----------------------------------------------------------------------------
create or replace function mark_request_fulfilled(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_request requests%rowtype; v_winner uuid;
begin
  select * into v_request from requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.requester_id <> auth.uid() then
    raise exception 'Only the requester can close this request';
  end if;
  if v_request.status <> 'awarded' then
    raise exception 'Award a bid before marking the request fulfilled';
  end if;

  update requests
     set status = 'fulfilled', closed_at = now(), updated_at = now()
   where id = p_request_id;

  update profiles
     set requests_fulfilled_count = requests_fulfilled_count + 1
   where id = v_request.requester_id;

  select bidder_id into v_winner from bids where id = v_request.awarded_bid_id;
  if v_winner is not null then
    insert into notifications (user_id, type, title, body, link, payload)
    values (v_winner, 'request_fulfilled', 'Request marked fulfilled',
            format('"%s" is complete. You can now leave a review.', v_request.title),
            '/requests/' || p_request_id,
            jsonb_build_object('request_id', p_request_id));
  end if;
end;
$$;

create or replace function cancel_request(p_request_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_request requests%rowtype; v_bidder record;
begin
  select * into v_request from requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Request not found'; end if;
  if v_request.requester_id <> auth.uid() and not is_staff() then
    raise exception 'Only the requester can cancel this request';
  end if;
  if v_request.status not in ('open','awarded') then
    raise exception 'Request is already closed';
  end if;

  update bids set status = 'rejected', updated_at = now()
   where request_id = p_request_id and status = 'pending';

  update requests set status = 'cancelled', closed_at = now(), updated_at = now()
   where id = p_request_id;

  for v_bidder in select distinct bidder_id from bids where request_id = p_request_id loop
    insert into notifications (user_id, type, title, body, link, payload)
    values (v_bidder.bidder_id, 'request_closed', 'Request cancelled',
            format('"%s" was cancelled by the requester.', v_request.title),
            '/requests/' || p_request_id,
            jsonb_build_object('request_id', p_request_id, 'reason', p_reason));
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- §4.1 Verification
-- -----------------------------------------------------------------------------
create or replace function submit_verification(p_admission_number text, p_id_image_path text)
returns verification_requests
language plpgsql security definer set search_path = public as $$
declare v_hash text; v_row verification_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  v_hash := admission_digest(p_admission_number);

  if exists (select 1 from profiles where admission_hash = v_hash and id <> auth.uid()) then
    raise exception 'That admission number is already verified on another account';
  end if;
  if exists (select 1 from verification_requests
              where user_id = auth.uid() and status = 'pending') then
    raise exception 'You already have a verification request awaiting review';
  end if;

  insert into verification_requests (user_id, admission_hash, id_image_path)
  values (auth.uid(), v_hash, p_id_image_path)
  returning * into v_row;

  update profiles set verification_status = 'pending' where id = auth.uid();
  return v_row;
end;
$$;

create or replace function review_verification(
  p_request_id uuid, p_approve boolean, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_req verification_requests%rowtype;
begin
  if not is_staff() then raise exception 'Moderators only'; end if;

  select * into v_req from verification_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'Verification request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Already reviewed'; end if;

  update verification_requests
     set status           = case when p_approve then 'verified' else 'rejected' end,
         reviewed_by      = auth.uid(),
         reviewed_at      = now(),
         rejection_reason = case when p_approve then null else p_reason end
   where id = p_request_id;

  update profiles
     set verification_status = case when p_approve then 'verified' else 'rejected' end,
         verified_at         = case when p_approve then now() else null end,
         admission_hash      = case when p_approve then v_req.admission_hash else admission_hash end
   where id = v_req.user_id;

  insert into notifications (user_id, type, title, body, link, payload)
  values (v_req.user_id, 'verification_reviewed',
          case when p_approve then 'You are verified' else 'Verification not approved' end,
          case when p_approve
               then 'Your student ID checked out. Listing and bidding caps are lifted.'
               else coalesce(p_reason, 'Your submission could not be verified. You can try again.') end,
          '/me/settings',
          jsonb_build_object('approved', p_approve));
end;
$$;

-- -----------------------------------------------------------------------------
-- §5.8 Moderation — report resolution and the 3-strikes rule
-- -----------------------------------------------------------------------------
create or replace function report_target_owner(p_type report_target, p_id uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select case p_type
    when 'listing' then (select seller_id from listings where id = p_id)
    when 'request' then (select requester_id from requests where id = p_id)
    when 'bid'     then (select bidder_id from bids where id = p_id)
    when 'profile' then p_id
    when 'review'  then (select reviewer_id from reviews where id = p_id)
  end;
$$;

create or replace function resolve_report(
  p_report_id uuid, p_status report_status, p_notes text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_report reports%rowtype; v_owner uuid; v_strikes int;
begin
  if not is_staff() then raise exception 'Moderators only'; end if;

  select * into v_report from reports where id = p_report_id for update;
  if v_report.id is null then raise exception 'Report not found'; end if;

  update reports
     set status = p_status, handled_by = auth.uid(), handled_at = now(),
         moderator_notes = coalesce(p_notes, moderator_notes)
   where id = p_report_id;

  if p_status <> 'actioned' then return; end if;

  v_owner := report_target_owner(v_report.target_type, v_report.target_id);
  if v_owner is null then return; end if;

  insert into strikes (user_id, report_id, reason)
  values (v_owner, p_report_id, coalesce(p_notes, v_report.reason))
  on conflict (report_id) do nothing;

  insert into notifications (user_id, type, title, body, link, payload)
  values (v_owner, 'moderation_action', 'Moderation action on your content',
          coalesce(p_notes, v_report.reason),
          '/prohibited-items',
          jsonb_build_object('target_type', v_report.target_type,
                             'target_id', v_report.target_id));

  -- 3 upheld reports inside 90 days -> automatic suspension pending review
  select count(*) into v_strikes from strikes
   where user_id = v_owner and created_at > now() - interval '90 days';

  if v_strikes >= 3 then
    update profiles
       set is_suspended     = true,
           suspended_until  = now() + interval '14 days',
           suspension_reason = format('%s upheld reports in 90 days', v_strikes)
     where id = v_owner;

    insert into notifications (user_id, type, title, body, link, payload)
    values (v_owner, 'account_suspended', 'Your account is suspended',
            'Three upheld reports in 90 days. Suspension is pending review.',
            '/contact', jsonb_build_object('strikes', v_strikes));
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- §8 Scheduled maintenance
-- -----------------------------------------------------------------------------
create or replace function expire_stale_records()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_listings int := 0;
  v_requests int := 0;
  v_warned   int := 0;
  r          record;
begin
  -- listings past their 30 days
  for r in
    update listings set status = 'expired', updated_at = now()
     where status = 'active' and expires_at <= now()
     returning id, seller_id, title
  loop
    v_listings := v_listings + 1;
    insert into notifications (user_id, type, title, body, link, payload)
    values (r.seller_id, 'listing_expired', 'Your listing expired',
            format('"%s" is no longer visible. Renew it in one tap.', r.title),
            '/listings/' || r.id || '/edit',
            jsonb_build_object('listing_id', r.id));
  end loop;

  -- day-27 renewal nudge (§5.1), once per listing
  for r in
    select l.id, l.seller_id, l.title from listings l
     where l.status = 'active'
       and l.expires_at between now() and now() + interval '3 days'
       and not exists (
         select 1 from notifications n
          where n.user_id = l.seller_id
            and n.type = 'listing_expiring'
            and n.payload->>'listing_id' = l.id::text)
  loop
    v_warned := v_warned + 1;
    insert into notifications (user_id, type, title, body, link, payload)
    values (r.seller_id, 'listing_expiring', 'Listing expiring in 3 days',
            format('"%s" expires soon. Renew it to keep it in the catalogue.', r.title),
            '/listings/' || r.id || '/edit',
            jsonb_build_object('listing_id', r.id));
  end loop;

  -- requests past their bid window
  for r in
    update requests set status = 'expired', closed_at = now(), updated_at = now()
     where status = 'open' and expires_at <= now()
     returning id, requester_id, title
  loop
    v_requests := v_requests + 1;

    update bids set status = 'expired', updated_at = now()
     where request_id = r.id and status = 'pending';

    insert into notifications (user_id, type, title, body, link, payload)
    values (r.requester_id, 'request_expired', 'Your request expired',
            format('"%s" closed without an award. Post it again if you still need it.', r.title),
            '/requests/' || r.id,
            jsonb_build_object('request_id', r.id));

    insert into notifications (user_id, type, title, body, link, payload)
    select distinct b.bidder_id, 'request_closed', 'Request closed',
           format('"%s" expired without an award.', r.title),
           '/requests/' || r.id,
           jsonb_build_object('request_id', r.id)
      from bids b where b.request_id = r.id and b.status = 'expired';
  end loop;

  return jsonb_build_object('listings_expired', v_listings,
                            'listings_warned', v_warned,
                            'requests_expired', v_requests);
end;
$$;

-- §4.1: the ID photo is deleted 30 days after the decision. Only the admission
-- hash survives, which is enough for uniqueness without holding the raw value.
create or replace function purge_verification_artifacts()
returns int
language plpgsql security definer set search_path = public, storage as $$
declare v_count int := 0; r record;
begin
  for r in
    select id, id_image_path from verification_requests
     where purge_after <= now() and id_image_path <> ''
  loop
    -- storage.objects belongs to supabase_storage_admin, so this can fail on
    -- permissions depending on project age. Clearing the path still severs the
    -- reference; pair this with a service-role Storage sweep if you see the
    -- notice below in the cron logs.
    begin
      delete from storage.objects
       where bucket_id = 'verification-docs' and name = r.id_image_path;
    exception when others then
      raise notice 'could not delete storage object %: %', r.id_image_path, sqlerrm;
    end;

    update verification_requests set id_image_path = '' where id = r.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- §5.6 Search. Not SECURITY DEFINER — these run as the caller so RLS keeps
-- doing the filtering.
-- -----------------------------------------------------------------------------
create or replace function search_listings(
  p_query         text default null,
  p_category_slug text default null,
  p_campus_slug   text default null,
  p_min_price     numeric default null,
  p_max_price     numeric default null,
  p_conditions    item_condition[] default null,
  p_verified_only boolean default false,
  p_sort          text default 'relevance',
  p_limit         int default 24,
  p_offset        int default 0
)
returns table (
  id uuid, title text, description text, price numeric, price_type price_type,
  condition item_condition, status listing_status, pickup_area text,
  created_at timestamptz, expires_at timestamptz,
  category_slug text, category_name text,
  seller_id uuid, seller_username text, seller_name text, seller_avatar_url text,
  seller_verified boolean, seller_rating_avg numeric, seller_rating_count int,
  image_path text, view_count int, favorite_count int,
  rank real, total_count bigint
)
language sql stable set search_path = public, extensions as $$
  with cat as (
    select c.id from categories c where p_category_slug is null or c.slug = p_category_slug
  ),
  q as (
    select case when nullif(trim(coalesce(p_query,'')), '') is null
                then null
                else websearch_to_tsquery('english', p_query) end as ts
  )
  select
    l.id, l.title, l.description, l.price, l.price_type, l.condition, l.status,
    l.pickup_area, l.created_at, l.expires_at,
    c.slug, c.name,
    p.id, p.username, p.full_name, p.avatar_url,
    p.verification_status = 'verified',
    p.seller_rating_avg, p.seller_rating_count,
    img.storage_path, l.view_count, l.favorite_count,
    case when q.ts is null then 0::real else ts_rank(l.search_vector, q.ts) end,
    count(*) over ()
  from listings l
  join categories c on c.id = l.category_id
  join profiles   p on p.id = l.seller_id
  join campuses   cm on cm.id = l.campus_id
  cross join q
  left join lateral (
    select li.storage_path from listing_images li
     where li.listing_id = l.id order by li.position limit 1
  ) img on true
  where l.status in ('active','reserved')
    and (p_campus_slug is null or cm.slug = p_campus_slug)
    and (p_category_slug is null
         or l.category_id in (select id from cat)
         or c.parent_id in (select id from cat))
    and (p_min_price is null or l.price >= p_min_price)
    and (p_max_price is null or l.price <= p_max_price)
    and (p_conditions is null or l.condition = any(p_conditions))
    and (not p_verified_only or p.verification_status = 'verified')
    and (q.ts is null
         or l.search_vector @@ q.ts
         or l.title % p_query)
  order by
    case when p_sort = 'price_asc'  then l.price end asc nulls last,
    case when p_sort = 'price_desc' then l.price end desc nulls last,
    case when p_sort = 'relevance' and q.ts is not null
         then ts_rank(l.search_vector, q.ts) end desc nulls last,
    l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function search_requests(
  p_query         text default null,
  p_category_slug text default null,
  p_campus_slug   text default null,
  p_open_only     boolean default true,
  p_sort          text default 'relevance',
  p_limit         int default 24,
  p_offset        int default 0
)
returns table (
  id uuid, title text, description text, budget_min numeric, budget_max numeric,
  needed_by date, status request_status, bid_count int, view_count int,
  expires_at timestamptz, created_at timestamptz,
  category_slug text, category_name text,
  requester_id uuid, requester_username text, requester_name text,
  requester_avatar_url text, requester_verified boolean,
  lowest_bid numeric, rank real, total_count bigint
)
language sql stable set search_path = public, extensions as $$
  with cat as (
    select c.id from categories c where p_category_slug is null or c.slug = p_category_slug
  ),
  q as (
    select case when nullif(trim(coalesce(p_query,'')), '') is null
                then null
                else websearch_to_tsquery('english', p_query) end as ts
  )
  select
    r.id, r.title, r.description, r.budget_min, r.budget_max, r.needed_by,
    r.status, r.bid_count, r.view_count, r.expires_at, r.created_at,
    c.slug, c.name,
    p.id, p.username, p.full_name, p.avatar_url,
    p.verification_status = 'verified',
    (select min(b.amount) from bids b where b.request_id = r.id and b.status = 'pending'),
    case when q.ts is null then 0::real else ts_rank(r.search_vector, q.ts) end,
    count(*) over ()
  from requests r
  join categories c on c.id = r.category_id
  join profiles   p on p.id = r.requester_id
  join campuses   cm on cm.id = r.campus_id
  cross join q
  where (not p_open_only or (r.status = 'open' and r.expires_at > now()))
    and r.status <> 'cancelled'
    and (p_campus_slug is null or cm.slug = p_campus_slug)
    and (p_category_slug is null
         or r.category_id in (select id from cat)
         or c.parent_id in (select id from cat))
    and (q.ts is null
         or r.search_vector @@ q.ts
         or r.title % p_query)
  order by
    case when p_sort = 'closing_soon' then r.expires_at end asc nulls last,
    case when p_sort = 'relevance' and q.ts is not null
         then ts_rank(r.search_vector, q.ts) end desc nulls last,
    r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- View counters. Cheap, unauthenticated, and deliberately not a client UPDATE.
create or replace function bump_view_count(p_target_type contact_target, p_target_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_target_type = 'listing' then
    update listings set view_count = view_count + 1 where id = p_target_id;
  elsif p_target_type = 'request' then
    update requests set view_count = view_count + 1 where id = p_target_id;
  end if;
end;
$$;

create or replace function mark_notifications_read(p_ids uuid[] default null)
returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  with updated as (
    update notifications set read_at = now()
     where user_id = auth.uid() and read_at is null
       and (p_ids is null or id = any(p_ids))
     returning 1
  )
  select count(*) into v_count from updated;
  return v_count;
end;
$$;
