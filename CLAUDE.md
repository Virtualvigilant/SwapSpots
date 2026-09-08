# CLAUDE.md

Working notes for this repo. The product and data spec lives in
`CAMPUS-MARKETPLACE-ARCHITECTURE.md` — it is the source of truth; this file only
covers how to work in the code.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build — run before calling anything done
npm run lint
npm run typecheck
npm run rls:probe  # anon-key RLS assertions against the live project
```

## Where things go

Four route groups under `src/app/`: `(marketing)`, `(auth)`, `(app)`,
`(admin)`. Put a new public page in `(marketing)`, a signed-in one in `(app)`.
Anything under `/me` inherits the account sidebar from `(app)/me/layout.tsx`.

Data flows one way: `src/lib/queries/` reads (Server Components only, several
wrapped in React `cache` so a render asks once), `src/lib/actions/` writes
(`"use server"`, one file per domain), `src/lib/validation/` holds the Zod
schemas both sides share. Supabase clients live in `src/lib/supabase/` —
`server.ts` per request, `client.ts` only inside a client island.

## Conventions

- **Never `select("*")` on `profiles`.** `phone_e164` and `admission_hash` are
  outside the grant for `anon`/`authenticated`, and the star expands to them, so
  the whole query fails with `permission denied`. Column lists live in
  `src/lib/queries/columns.ts`.
- Interpolating a column-list constant into a PostgREST `select()` defeats
  supabase-js's select-string inference. When that happens, declare the row type
  and cast — `getVerifications` is the worked example.
- **Server Components by default.** Add `"use client"` only for a genuine
  interactive island (the header menu, the New Arrivals rail, the countdown).
- **Design tokens, not literals.** Colours, shadows and radii come from
  `@theme` in `src/app/globals.css`. Do not introduce a new hex value in a
  component; add a token.
- **Tailwind v4 arbitrary values**: a bare `/` inside `shadow-[...]` or similar
  is parsed as an opacity modifier and silently emits broken CSS that takes the
  whole stylesheet down. Put multi-part shadows in a `--shadow-*` token instead.
- **lucide-react has no brand logos.** WhatsApp, Instagram and X live in
  `src/components/ui/brand-icons.tsx`.
- Prices always render through `kes()` in `src/lib/format.ts`.
- Buttons are `next/link`s far more often than `<button>`, so styling comes from
  `buttonClasses(variant, size)` rather than a `<Button>` component.
- Active nav state is derived from `usePathname()`, never passed as a prop.

## Hard rules from the spec

- `phone_e164` never appears in a page payload. Contact reveal goes through the
  `reveal_contact()` RPC, which logs a `contact_event`. (§5.3)
- Multi-row mutations are `SECURITY DEFINER` RPCs, not sequential client calls.
  `award_bid` in particular must be one transaction. (§5.2)
- RLS on every table, written with the schema, never retrofitted. (§16)
- Regenerate types after every migration:
  `supabase gen types typescript --local > src/types/database.ts`.
- Run `npm run rls:probe` after every migration. It hits the live project with
  the anon key and asserts that every private read and every write is refused.

## Verifying UI work

Headless Chrome on Windows clamps its window to a 512px minimum, so
`--window-size=390,...` renders a 512px page and crops it — narrow screenshots
look broken when they are not. To check a real mobile width, load the page in a
fixed-width iframe and screenshot the wrapper.
