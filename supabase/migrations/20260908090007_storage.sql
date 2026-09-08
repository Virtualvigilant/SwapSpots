-- =============================================================================
-- 0007 — Storage buckets and policies
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §9.1, §10
--
-- Object paths are `{user_id}/{filename}` in every bucket, which is what makes
-- the owner check a cheap prefix comparison rather than a join.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images', 'listing-images', true,  5242880,
     array['image/webp','image/jpeg','image/png','image/avif']),
  ('avatars', 'avatars', true, 2097152,
     array['image/webp','image/jpeg','image/png','image/avif']),
  ('verification-docs', 'verification-docs', false, 8388608,
     array['image/webp','image/jpeg','image/png','application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- listing-images / avatars — public read, owner write, path-scoped
-- -----------------------------------------------------------------------------
drop policy if exists "public images are readable" on storage.objects;
create policy "public images are readable" on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('listing-images','avatars'));

drop policy if exists "own folder image upload" on storage.objects;
create policy "own folder image upload" on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('listing-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_active_user()
  );

drop policy if exists "own folder image update" on storage.objects;
create policy "own folder image update" on storage.objects for update
  to authenticated
  using (
    bucket_id in ('listing-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('listing-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own folder image delete" on storage.objects;
create policy "own folder image delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('listing-images','avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

-- -----------------------------------------------------------------------------
-- verification-docs — fully private. Owner may upload, staff may read via a
-- short-TTL signed URL. Nobody gets a listing of the bucket.
-- -----------------------------------------------------------------------------
drop policy if exists "verification upload own" on storage.objects;
create policy "verification upload own" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification read staff" on storage.objects;
create policy "verification read staff" on storage.objects for select
  to authenticated
  using (bucket_id = 'verification-docs' and public.is_staff());

drop policy if exists "verification delete staff" on storage.objects;
create policy "verification delete staff" on storage.objects for delete
  to authenticated
  using (bucket_id = 'verification-docs' and public.is_staff());
