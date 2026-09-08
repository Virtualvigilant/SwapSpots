-- =============================================================================
-- 0009 — Drop the verification gate
--
-- §4 made verification a soft gate: unverified members hit lower caps and could
-- not bid above KES 3,000. That is now off. Anyone with an account can list,
-- request and bid on the same terms.
--
-- The rate limits themselves stay, levelled up to what used to be the verified
-- tier. They were doing two different jobs — pushing people toward verification,
-- and stopping one account from flooding the board — and only the first one is
-- being removed. A public marketplace with no ceiling at all gets spammed.
--
-- Nothing about the verification machinery is deleted: `verification_requests`,
-- `submit_verification`, `review_verification`, the private bucket and the
-- admin queue all still work, and the badge still renders for anyone a
-- moderator approves. Re-tightening is a matter of restoring the two-tier
-- `case` expressions below.
-- =============================================================================

set search_path = public;

-- §5.1 cap, previously 3 unverified / 25 verified.
create or replace function enforce_listing_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int := 25; v_active int;
begin
  if is_staff() then return new; end if;
  if new.status not in ('active','reserved') then return new; end if;

  select count(*) into v_active from listings
   where seller_id = new.seller_id and status in ('active','reserved') and id <> new.id;

  if v_active >= v_cap then
    raise exception 'Listing cap reached (% active). Mark something sold or hide a listing to free a slot.', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Previously 2/day unverified, 10/day verified.
create or replace function enforce_request_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int := 10; v_today int;
begin
  if is_staff() then return new; end if;

  select count(*) into v_today from requests
   where requester_id = new.requester_id and created_at > now() - interval '24 hours';

  if v_today >= v_cap then
    raise exception 'Daily request limit reached (% per day).', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Previously 5/day unverified, 40/day verified, plus a KES 3,000 ceiling on
-- unverified bids. The ceiling is gone entirely.
create or replace function enforce_bid_rules() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int := 40; v_today int;
begin
  if tg_op = 'INSERT' and not is_staff() then
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

-- Previously 5/day unverified, 15/day verified.
create or replace function enforce_report_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_cap int := 15; v_today int;
begin
  if is_staff() then return new; end if;

  select count(*) into v_today from reports
   where reporter_id = new.reporter_id and created_at > now() - interval '24 hours';

  if v_today >= v_cap then
    raise exception 'Daily report limit reached (% per day).', v_cap
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Previously 10/day unverified, 60/day verified.
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

  -- One tier for everyone. This is an abuse ceiling, not a verification gate:
  -- counted on distinct targets so re-opening the same page does not burn it.
  v_cap := 60;
  select count(distinct target_id) into v_used
    from contact_events
   where initiator_id = v_me and created_at > now() - interval '24 hours';

  if v_used >= v_cap and not exists (
    select 1 from contact_events
     where initiator_id = v_me and target_id = p_target_id
       and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Daily contact limit reached (% per day).', v_cap
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
