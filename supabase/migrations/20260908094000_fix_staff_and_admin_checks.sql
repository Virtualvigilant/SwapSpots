-- =============================================================================
-- Fix is_staff and is_admin for direct DB administration
--
-- Previously, is_staff() and is_admin() strictly queried profiles where id = auth.uid().
-- When running queries in the Supabase Dashboard Table Editor, SQL Editor,
-- migrations, or via service_role, auth.uid() is NULL, causing is_staff()
-- to evaluate to false and guard_profile_privileges() to silently revert
-- any changes to role, verification_status, etc. back to old.*.
--
-- This update allows database superusers (postgres / supabase_admin) and
-- service_role callers to pass staff/admin checks.
-- =============================================================================

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    session_user in ('postgres', 'supabase_admin')
    or (auth.jwt()->>'role') = 'service_role'
    or (select role in ('moderator','admin') from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    session_user in ('postgres', 'supabase_admin')
    or (auth.jwt()->>'role') = 'service_role'
    or (select role = 'admin' from profiles where id = auth.uid()),
    false
  );
$$;
