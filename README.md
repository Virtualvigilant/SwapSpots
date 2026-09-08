# SwapSpot

Campus marketplace for Kabarak University. Every account is both a buyer and a
seller. Two ways to find things:

- **Listings** — someone posts what they are selling.
- **Requests** — someone posts what they need, sellers bid on it, the requester
  awards one bid.

The platform is **discovery only**. It never holds funds. Once two people match,
they are handed off to WhatsApp and transact directly.

Full product and data specification: [`CAMPUS-MARKETPLACE-ARCHITECTURE.md`](./CAMPUS-MARKETPLACE-ARCHITECTURE.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run lint
npm run typecheck
npm run rls:probe            # anon-key RLS assertions against the live project
```

The database has to exist first. Migrations and seed data are in `supabase/` —
see [`supabase/README.md`](./supabase/README.md) for the apply order and the
three deliberate departures from the spec.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react
· Zod · Supabase (Postgres, Auth, Storage, Realtime).

Server Components read through `src/lib/queries/`; every write is a Server
Action in `src/lib/actions/`. Row Level Security is the security boundary — the
middleware guard only exists so a signed-out visitor gets a redirect instead of
an empty page. See `PROGRESS.md` for what is and is not finished.

## Layout

```
src/
├── app/
│   ├── layout.tsx            fonts + metadata
│   ├── globals.css           design tokens (@theme) and shared utilities
│   ├── not-found.tsx
│   ├── (marketing)/          landing, how it works, about, contact, blog,
│   │                         verification, prohibited items, report, terms
│   ├── (auth)/               sign in, sign up, OAuth callback route
│   ├── (app)/                browse, categories, search, listings, requests,
│   │                         public profiles, and the /me account area
│   └── (admin)/admin/        reports, verifications, categories,
│                             others watch, metrics
├── components/
│   ├── layout/               shell, header, footer, account nav, admin nav
│   ├── home/                 landing page sections
│   ├── browse/               filter panel, results bar, listing grid
│   ├── listings/             gallery, contact panel, listing form
│   ├── requests/             request card, bid row, status badge
│   └── ui/                   buttons, badges, fields, avatars, ratings…
└── lib/
    ├── supabase/             browser, server and middleware clients
    ├── queries/              typed reads, Server Components only
    ├── actions/              "use server" writes, one file per domain
    ├── validation/           Zod schemas shared by client and server
    ├── site.ts               nav + brand copy
    ├── constants.ts          pickup areas, caps, sort options
    ├── format.ts             KES, relative time, enum labels
    ├── images.ts             storage URLs · images.client.ts compression
    └── whatsapp.ts           the reveal_contact payload shape
```

Each of the four route groups has its own layout. `(marketing)` and `(app)`
share the public shell; `(auth)` is a split screen with no nav; `(admin)` is a
dark shell so a moderation view can never be mistaken for a public page.

## Design tokens

Defined once in `src/app/globals.css` under `@theme`. Everything else composes
from them, so a rebrand is a single-file change.

| Token | Value | Use |
|---|---|---|
| `--color-brand` | `#ff5b2e` | primary actions, accents, active nav |
| `--color-ink` | `#14141a` | headings, dark surfaces |
| `--color-ink-500` | `#6d6d78` | body copy |
| `--color-canvas` | `#f5f2f0` | hero and footer background |
| `--color-surface` | `#f4f4f5` | product tile backgrounds |
| `--color-line` | `#eae7e4` | borders and dividers |

Type: **Plus Jakarta Sans** for display, **Inter** for body — both via
`next/font/google`, so the first build needs network access.

## Images

Listing photos and avatars live in Supabase Storage and are uploaded by users;
the browser compresses them to WebP at 1600px before upload, which also strips
EXIF and with it the GPS tag on a hostel photo.

`public/images/` holds only design assets: the eight `c-*` category tiles, the
hero portrait and the promo banner. Category art is mapped by slug in
`src/lib/category-art.ts`, and a category without art falls back to its icon —
so an admin can add one without sourcing a photograph first.
