# Database

Phase 0 of §14. The schema, RLS, RPCs and seed data for
`CAMPUS-MARKETPLACE-ARCHITECTURE.md` §6 – §10.

## Files

Run in filename order — each depends on the ones before it.

| File | What it does |
|---|---|
| `migrations/…0001_extensions_and_enums.sql` | `pgcrypto`, `pg_trgm`, the 12 enums (§6.0–6.1) |
| `migrations/…0002_tables.sql` | 17 tables, constraints, indexes, `profiles_public` (§6.2–6.8) |
| `migrations/…0003_functions_and_triggers.sql` | Privilege guard, self-bid block, review gate, reputation, counters, notification fan-out, rate limits, keyword pre-screen (§5.4, §5.8, §7.1, §9.3) |
| `migrations/…0004_rls.sql` | RLS on every table (§7) |
| `migrations/…0005_rpcs.sql` | `award_bid`, `reveal_contact`, `mark_request_fulfilled`, search, moderation, scheduled jobs (§8) |
| `migrations/…0006_grants_and_realtime.sql` | Column-scoped grants that keep `phone_e164` unreadable; Realtime publication (§5.3, §9.4, §10) |
| `migrations/…0007_storage.sql` | `listing-images`, `avatars`, `verification-docs` buckets and policies (§10) |
| `migrations/…0008_cron.sql` | `expire-stale` every 15 min, `purge-ids` daily (§8.2) |
| `seed.sql` | Kabarak campus, the 8 launch categories, the moderation deny-list (§5.5, §5.8) |

## Applying

**Via the CLI** (needs the database password from Dashboard → Settings → Database):

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql     # or paste seed.sql into the SQL editor
```

**Via the dashboard:** paste each file into the SQL editor in filename order.

Two things the SQL cannot do for you:

- **`pg_cron`** must be enabled first (Database → Extensions). `0008` is a no-op
  and prints a notice if it is missing — the listing expiry job is what stops
  the catalogue rotting, so do not leave it unscheduled.
- **Storage** — `0007` writes to `storage.buckets` and `storage.objects`, which
  are owned by `supabase_storage_admin`. If it errors on permissions, create the
  three buckets in the dashboard and re-run just the policy statements.

Then regenerate types, per `CLAUDE.md`:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

## Three deliberate departures from the spec

**1. RLS is `ENABLE`d but not `FORCE`d (§7).** `FORCE` applies policies to the
table owner too, and every table here is owned by `postgres` — the same role
that owns the `SECURITY DEFINER` RPCs of §8. With `FORCE` on, `award_bid()`
cannot reject the losing bids or insert anyone else's notifications, and
`reveal_contact()` cannot read `phone_e164` or write a `contact_event`: the RPC
pattern the whole spec is built on stops working. `anon` and `authenticated` are
bound by RLS either way — `FORCE` changes nothing for them.

Phone privacy is therefore held by **column-scoped grants** (`0006`) rather than
by `FORCE`: `revoke all … from anon, authenticated`, then `grant select (…)` on
a column list that omits `phone_e164` and `admission_hash`. A table-level
`GRANT SELECT` implies every column, so the §10 line "phone_e164 revoked from
anon and authenticated" is only actually achievable this way.

**2. Two tables the spec does not name.** §5.8 asks for a keyword pre-screen
that "flags likely violations into a review queue before publication rather than
blocking outright", and a strike system — neither has anywhere to write. Added
`moderation_flags` (keyword hits, resolvable by a moderator) and `strikes` (the
90-day ledger `resolve_report()` counts). `severity = 'block'` still refuses the
write; `'flag'` publishes and queues.

**3. Review eligibility is wider than §6.7's trigger.** As written, that trigger
matches a `contact_event` on `target_id = context_id` — but `award_bid()` logs
its contact event against the **bid** id, not the request id, so no request
review could ever pass. The rewritten trigger handles the two contexts
separately: request reviews require `status = 'fulfilled'` plus the correct two
parties and the correct `reviewed_role`; listing reviews keep the original
contact-event rule and additionally check that one party is the seller.

## Not done yet

The anon-key RLS probe script (§16). Write it before Phase 1 and run it after
every migration — it is the only thing that proves the policies above actually
hold.
