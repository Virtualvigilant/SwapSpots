# Progress

Tracks the build against the roadmap in §14 of `CAMPUS-MARKETPLACE-ARCHITECTURE.md`.

## Done

### Phase 0 — Foundation
- Schema applied to the Supabase project: 12 enums, 17 tables, indexes, the §8
  RPCs, storage buckets, cron jobs. Migrations in `supabase/migrations/`, seed
  in `supabase/seed.sql`, rationale in `supabase/README.md`.
- `src/types/database.ts` generated from the live database.
- Auth wired end to end: email + password, magic link, `/callback` code
  exchange, sign-out. `handle_new_user` creates the profile from signup
  metadata; anyone who arrives without it (magic link, OAuth) gets the
  onboarding form at `/me/settings`.
- `middleware.ts` refreshes the session on every render request and guards
  `/me`, `/admin`, `/listings/new`, `/requests/new`. `/admin` additionally
  checks `is_staff()`. The guard is convenience — RLS is the boundary.
- `scripts/rls-probe.mjs` (`npm run rls:probe`): 30 assertions against the live
  project with the anon key. All 30 pass.

### The data layer
- `src/lib/queries/` — reads, Server Components only, several wrapped in React
  `cache`. `columns.ts` holds the profile column lists that keep `phone_e164`
  out of every select.
- `src/lib/actions/` — writes, one `"use server"` file per domain, with
  `errors.ts` translating Postgres codes and trigger `RAISE`s into sentences a
  student should read.
- `src/lib/validation/` — Zod schemas mirroring the §6 CHECK constraints.

### Phases 1–4, wired
- **Listings** — create, edit, delete, status (reserved / sold / hidden /
  re-list / renew), browse with filters and paging, detail page, favourites.
  Images compress in the browser to WebP at 1600px (which also strips EXIF) and
  upload straight to Storage; the form only ever posts storage paths.
- **Requests and bidding** — board, creation, one bid per person with editing
  and withdrawal, public bid list sorted lowest-first, `award_bid` behind a
  confirm step, fulfil and cancel, notification fan-out, category follows.
- **Trust** — verification submission to the private bucket and admin review
  through 60-second signed URLs, dual reputation on profiles, contact-gated
  reviews, public profile pages.
- **Safety and ops** — reporting from every listing, request and profile plus
  the standalone `/report` page, moderator queue with dismiss / remove /
  uphold, strike counts, Others watch, real §13 metrics.
- **Search** — `/search` and `/browse` both run the `search_listings` /
  `search_requests` RPCs: ranked FTS, trigram fallback, filters, paging.
- **Realtime** (§9.4) — two narrow subscriptions only: `notifications` filtered
  to the signed-in user (bell badge) and `bids` filtered to one open request
  (live bid list). Nothing subscribes to the feed.

### Placeholder content removed
`src/lib/data/` is deleted. Every surface reads from Supabase, and the fake
avatars and product photos are gone from `public/images/` — only the eight
category tiles, the hero portrait and the promo banner remain, and those are
design assets rather than data. The landing page shows real counts or nothing,
and carries a cold-start state for an empty catalogue.

### Verified
`npm run typecheck`, `npm run lint` and `npm run build` all clean (38 routes).
Every route smoke-tested for a 200 against the live database; guards return 307
to `/sign-in`; seeded categories render; `npm run rls:probe` 30/30.

## Not done

- **Authenticated write paths are not yet exercised end to end.** Signup →
  listing → bid → award → reveal has been type-checked and built but not run,
  because that means creating real users in the live project and the
  service-role key needed to clean them up afterwards is not in `.env`.
- **Email (Resend).** §5.7 wants email as a fallback for accepted bids,
  expiring listings and moderation actions. Nothing sends email yet; everything
  is in-app only.
- **`/blog`.** Six planned posts with no `/blog/[slug]` route behind them. The
  cards no longer link anywhere rather than linking to a 404 — write the posts
  and the route, or drop the page.
- **Account deletion** is described on `/me/settings` as a manual request; it
  needs the service role to actually remove the auth user.
- **PWA manifest and install prompt** (Phase 5).
- **`pg_cron`** must be enabled in the dashboard before the expiry and purge
  jobs actually run — see `supabase/README.md`.

## Standing notes

- `.env` holds only the URL and anon key. A service-role key is needed for
  account deletion, storage sweeps and any admin script.
- The contact form opens the visitor's mail client. There is no
  `contact_messages` table and no email provider, and a form that silently
  discards what someone typed is worse than no form.
- Pickup areas and availability options live in `src/lib/constants.ts` — they
  are campus geography, not reference data, so they are not rows.
