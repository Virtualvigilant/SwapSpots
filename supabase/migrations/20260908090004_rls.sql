-- =============================================================================
-- 0004 — Row Level Security
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §7
--
-- RLS is the security boundary. Assume every table is reachable directly with
-- the anon key, because it is.
--
-- A DELIBERATE DEPARTURE FROM §7: RLS is ENABLEd on every table but not FORCEd.
-- FORCE applies policies to the table owner as well, and every table here is
-- owned by `postgres` — the same role that owns the SECURITY DEFINER RPCs in
-- §8. Forcing it would make award_bid() unable to reject the losing bids or
-- insert anyone else's notifications, and reveal_contact() unable to read
-- phone_e164 or write a contact_event: the RPC pattern the spec is built on
-- stops working. `anon` and `authenticated` are subject to RLS either way —
-- FORCE changes nothing for them. Phone privacy is held by the column-scoped
-- grants in 0006, not by FORCE.
-- =============================================================================

set search_path = public;

do $$
declare t text;
begin
  foreach t in array array[
    'campuses','categories','profiles','listings','listing_images','requests',
    'bids','reviews','favorites','category_subscriptions','notifications',
    'reports','contact_events','verification_requests','moderation_keywords',
    'moderation_flags','strikes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Reference data: world-readable, admin-writable
-- -----------------------------------------------------------------------------
drop policy if exists campuses_read on campuses;
create policy campuses_read on campuses for select
  to anon, authenticated using (true);

drop policy if exists campuses_write on campuses;
create policy campuses_write on campuses for all
  to authenticated using (is_admin()) with check (is_admin());

drop policy if exists categories_read on categories;
create policy categories_read on categories for select
  to anon, authenticated using (true);

drop policy if exists categories_write on categories;
create policy categories_write on categories for all
  to authenticated using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- PROFILES — everyone reads non-suspended profiles; only the owner writes.
-- Column privileges (0006) keep phone_e164 out of every select.
-- -----------------------------------------------------------------------------
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select
  to anon, authenticated using (not is_suspended or id = auth.uid() or is_staff());

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles for insert
  to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update
  to authenticated using (id = auth.uid() or is_staff())
  with check (id = auth.uid() or is_staff());

-- -----------------------------------------------------------------------------
-- LISTINGS — public sees active/reserved; owner sees all of their own
-- -----------------------------------------------------------------------------
drop policy if exists listings_read_public on listings;
create policy listings_read_public on listings for select
  to anon, authenticated
  using (status in ('active','reserved') or seller_id = auth.uid() or is_staff());

drop policy if exists listings_insert on listings;
create policy listings_insert on listings for insert
  to authenticated with check (seller_id = auth.uid() and is_active_user());

drop policy if exists listings_update_own on listings;
create policy listings_update_own on listings for update
  to authenticated using (seller_id = auth.uid() or is_staff())
  with check (seller_id = auth.uid() or is_staff());

drop policy if exists listings_delete_own on listings;
create policy listings_delete_own on listings for delete
  to authenticated using (seller_id = auth.uid() or is_staff());

-- listing_images inherit their parent's visibility: the sub-select is itself
-- filtered by listings_read_public for the calling role.
drop policy if exists listing_images_read on listing_images;
create policy listing_images_read on listing_images for select
  to anon, authenticated
  using (exists (select 1 from listings l where l.id = listing_id));

drop policy if exists listing_images_write on listing_images;
create policy listing_images_write on listing_images for all
  to authenticated
  using (exists (select 1 from listings l
                  where l.id = listing_id and (l.seller_id = auth.uid() or is_staff())))
  with check (exists (select 1 from listings l
                  where l.id = listing_id and (l.seller_id = auth.uid() or is_staff())));

-- -----------------------------------------------------------------------------
-- REQUESTS
-- -----------------------------------------------------------------------------
drop policy if exists requests_read on requests;
create policy requests_read on requests for select
  to anon, authenticated
  using (status <> 'cancelled' or requester_id = auth.uid() or is_staff());

drop policy if exists requests_insert on requests;
create policy requests_insert on requests for insert
  to authenticated with check (requester_id = auth.uid() and is_active_user());

drop policy if exists requests_update_own on requests;
create policy requests_update_own on requests for update
  to authenticated using (requester_id = auth.uid() or is_staff())
  with check (requester_id = auth.uid() or is_staff());

drop policy if exists requests_delete_own on requests;
create policy requests_delete_own on requests for delete
  to authenticated using (requester_id = auth.uid() or is_staff());

-- -----------------------------------------------------------------------------
-- BIDS — transparent by design (§5.2). Amount and identity are both public;
-- blind bidding kills the price benefit that justifies the request board.
-- -----------------------------------------------------------------------------
drop policy if exists bids_read on bids;
create policy bids_read on bids for select
  to anon, authenticated using (true);

drop policy if exists bids_insert on bids;
create policy bids_insert on bids for insert
  to authenticated with check (
    bidder_id = auth.uid()
    and is_active_user()
    and exists (
      select 1 from requests r
      where r.id = request_id
        and r.status = 'open'
        and r.expires_at > now()
    )
  );

-- Only the bidder edits, and only while pending (§5.2). Award/reject happen
-- inside award_bid(), which runs as owner and is not bound by this.
drop policy if exists bids_update_own on bids;
create policy bids_update_own on bids for update
  to authenticated using (bidder_id = auth.uid() and status = 'pending')
  with check (bidder_id = auth.uid() and status in ('pending','withdrawn'));

drop policy if exists bids_delete_staff on bids;
create policy bids_delete_staff on bids for delete
  to authenticated using (is_staff());

-- -----------------------------------------------------------------------------
-- CONTACT EVENTS — written only by reveal_contact()/award_bid(); readable by
-- the two participants. No insert policy is intentional.
-- -----------------------------------------------------------------------------
drop policy if exists contact_events_read on contact_events;
create policy contact_events_read on contact_events for select
  to authenticated
  using (initiator_id = auth.uid() or recipient_id = auth.uid() or is_staff());

-- -----------------------------------------------------------------------------
-- REVIEWS — public to read, contact-gated to write (trigger in 0003), and
-- immutable to their author so ratings cannot be quietly rewritten.
-- -----------------------------------------------------------------------------
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select
  to anon, authenticated using (true);

drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert
  to authenticated with check (reviewer_id = auth.uid() and is_active_user());

drop policy if exists reviews_moderate on reviews;
create policy reviews_moderate on reviews for delete
  to authenticated using (is_staff());

-- -----------------------------------------------------------------------------
-- Personal lists
-- -----------------------------------------------------------------------------
drop policy if exists favorites_own on favorites;
create policy favorites_own on favorites for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists category_subscriptions_own on category_subscriptions;
create policy category_subscriptions_own on category_subscriptions for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- NOTIFICATIONS — strictly own. Inserts come from triggers and RPCs only.
drop policy if exists notifications_read on notifications;
create policy notifications_read on notifications for select
  to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on notifications;
create policy notifications_delete on notifications for delete
  to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Moderation surfaces
-- -----------------------------------------------------------------------------
drop policy if exists reports_read on reports;
create policy reports_read on reports for select
  to authenticated using (reporter_id = auth.uid() or is_staff());

drop policy if exists reports_insert on reports;
create policy reports_insert on reports for insert
  to authenticated with check (reporter_id = auth.uid() and is_active_user());

drop policy if exists reports_update_staff on reports;
create policy reports_update_staff on reports for update
  to authenticated using (is_staff()) with check (is_staff());

drop policy if exists verification_requests_own on verification_requests;
create policy verification_requests_own on verification_requests for select
  to authenticated using (user_id = auth.uid() or is_staff());

drop policy if exists verification_requests_insert on verification_requests;
create policy verification_requests_insert on verification_requests for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists verification_requests_review on verification_requests;
create policy verification_requests_review on verification_requests for update
  to authenticated using (is_staff()) with check (is_staff());

drop policy if exists moderation_keywords_staff on moderation_keywords;
create policy moderation_keywords_staff on moderation_keywords for all
  to authenticated using (is_staff()) with check (is_admin());

drop policy if exists moderation_flags_staff on moderation_flags;
create policy moderation_flags_staff on moderation_flags for select
  to authenticated using (is_staff());

drop policy if exists moderation_flags_resolve on moderation_flags;
create policy moderation_flags_resolve on moderation_flags for update
  to authenticated using (is_staff()) with check (is_staff());

drop policy if exists strikes_read on strikes;
create policy strikes_read on strikes for select
  to authenticated using (user_id = auth.uid() or is_staff());
