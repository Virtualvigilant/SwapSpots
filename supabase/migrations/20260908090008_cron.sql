-- =============================================================================
-- 0008 — Scheduled jobs
-- CAMPUS-MARKETPLACE-ARCHITECTURE.md §8.2
--
-- pg_cron has to be enabled for the project first (Dashboard -> Database ->
-- Extensions -> pg_cron, or `create extension pg_cron;` as a superuser). The
-- block below is a no-op when it is not installed, so the migration is safe to
-- run either way -- but the expiry job is what stops the catalogue rotting
-- (§5.1), so do not leave it unscheduled.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed - skipping job scheduling. Enable it, then re-run this file.';
    return;
  end if;

  perform cron.unschedule(jobname)
    from cron.job where jobname in ('expire-stale','purge-ids');

  perform cron.schedule('expire-stale', '*/15 * * * *', $job$ select public.expire_stale_records(); $job$);
  perform cron.schedule('purge-ids',    '0 3 * * *',    $job$ select public.purge_verification_artifacts(); $job$);
end $$;
