# Zoomo — AI Context / Handoff Doc

This file exists so a fresh AI session (any model — Grok, Claude, etc.) can
get oriented in this repo in one read, without re-deriving what's already
been figured out. Written 2026-09-17, last updated 2026-09-17 (later the
same day — this project moves fast). Keep it updated as the project moves;
treat anything below as a snapshot, not a guarantee — verify against the
actual code before relying on specifics like file paths or line numbers.

## What this is

Zoomo Eats — a food-delivery platform for one town (Jourian), built as a
NestJS backend plus multiple separate frontends, one per role. It's a real
system with a real Postgres database (not just mock data), currently run
entirely locally for development.

## The apps

All under `ZOOMO_1-main/`. Each frontend is its own Vite app with its own
`package.json`, `node_modules`, `.env`.

| App | Port | Stack | Role |
|---|---|---|---|
| `backend` | 3000 | NestJS + Prisma + Postgres | Shared API for every frontend below |
| `zoomo-eats-grok` | 5173 | Vite + React + TanStack Router | **The real customer app.** Actively developed. Has its own embedded `pglite` DB path for local-only use — but also talks to the real backend via `VITE_API_URL`. |
| `zomo-driver-app` | 5174 | Vite + React Router | Driver/rider app. Real backend. Actively developed. |
| `zomo-merchant-app` | 5175 | Vite + React Router | Merchant/restaurant dashboard. Real backend. Actively developed. |
| `zomo-admin-app` | 5176 | Vite + React Router | Admin/HQ dashboard. Real backend. Most actively developed of the three staff apps. |
| `zomo-portal` | 5180 | Vite + React Router | Landing hub — links out to the 4 apps above. Not a functional app itself, just a switcher. |

### Important: don't confuse these with grok's *internal* routes

`zoomo-eats-grok` used to also contain its own internal `/admin`,
`/merchant`, `/driver`, `/portals` prototype pages (backed by its embedded
pglite db). **These were deleted** on 2026-09-17 — they were a stale
early prototype, last touched a full day before the real work happened in
the standalone `zomo-admin-app`/`zomo-merchant-app`/`zomo-driver-app`. If
you see references to them in old context/memory, they're gone now. Grok
is customer-only.

`zomo-customer-app` (a separate, now-deleted app) was also a duplicate of
grok's customer flow — removed for the same reason. If anything references
it, it no longer exists.

## Backend

- NestJS, Prisma ORM, Postgres (`postgresql://shivmehra@localhost:5432/zoomo`).
- Start: `cd backend && npm run start:dev` (port 3000, `PORT` env var).
- Prisma models: `User`, `Address`, `Restaurant`, `Dish`, `DishSize`, `Cart`,
  `CartItem`, `Order`, `OrderMessage`, `OrderItem`, `Payment`, `Driver`,
  `Review`, `Favorite`, `Promotion`, `Payout`.
- Modules: `address`, `admin`, `auth`, `cart`, `common`, `dishes`, `driver`,
  `favorites`, `merchant`, `orders`, `payments`, `payouts`, `realtime`,
  `restaurants`, `upload`, `users`.
- `GET /restaurants` is public and returns restaurants with nested `dishes`
  — this is what `zomo-portal` uses to show live restaurant/menu-item
  counts instead of hardcoded numbers.
- JWT auth, role guards (`USER`, `MERCHANT`, `DRIVER`, `ADMIN`).

## Restaurant data (as of 2026-09-17, evening) — real, not demo

The database was fully wiped and reseeded this session (see "Recent
history" below). Current state:

| Restaurant | id | Dishes | Real business? |
|---|---|---|---|
| I Love Pizza | `pizza-palace` | 89 | Owner-supplied menu, real prices/photos |
| In The Hood Cafe | `moonlight-cafe` | 154 | Owner-supplied menu, real prices/photos |
| Moonlight Cafe | `ml-moonlight` | 43 | Owner-supplied menu (a **separate, distinct** business from "In The Hood Cafe" above — don't confuse the two despite the similar name and the fact that "moonlight-cafe" the *id* now belongs to In The Hood Cafe, a historical accident from how they were seeded in sequence) |
| Coffee Xpress | `coffee-xpress` | 0 | Real business, verified via web search (Justdial), no menu given yet |

All four are real Jourian addresses: `Jourian, Jammu & Kashmir 181202`,
lat/lng `32.834, 74.577` (verified via web search, not fabricated).

Seed/fix scripts live in `backend/scripts/` (`seed-real-menus.ts`,
`seed-moonlight-cafe.ts`, `add-coffee-xpress.ts`, `fix-dish-images.ts`) —
they're a record of how the data got there and can be re-run, but the
database itself is the source of truth going forward, not the scripts.

**Every dish has a distinct photo within its own restaurant** (0 duplicate
`imageUrl` values per restaurant, verified by query) — sourced from
Unsplash search-results pages (fetch the page, extract the
`images.unsplash.com/photo-...` CDN URLs, batch-verify each with a HEAD
request before using it — `source.unsplash.com`'s old keyword-random
endpoint is dead, 503). If you add more dishes, keep doing this — the
owner explicitly flagged repeated/wrong images as unacceptable once
already.

A pre-wipe database backup lives at `ZOOMO/backups/*.sql` (not committed —
it's a data dump). There's no other backup mechanism; be careful with any
further destructive DB operations.

## Design system (the real brand — use this, not improvised colors)

The three staff apps (`zomo-admin-app`, `zomo-merchant-app`,
`zomo-driver-app`) and `zomo-portal` share this exact token set (Tailwind
`colors` in each app's `tailwind.config.js`):

```js
"z-primary":    "#0F3D2D",
"z-hover":      "#164A39",
"z-accent":     "#1F7A52",
"z-page":       "#F4F7F5",
"z-surface":    "#FFFFFF",
"z-ink":        "#0C1612",
"z-sub":        "#5A6660",
"z-muted":      "#8A938E",
"z-line":       "#DCE6E0",
"z-line-soft":  "#EEF3F0",
"z-danger":     "#B42318",
"z-sage":       "#D7E6DE",
```

- **Font**: Satoshi, loaded via Fontshare
  (`https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`).
  Not Inter, not a Google Font.
- **Shared component classes** (defined per-app in `src/index.css`, `@apply`
  onto the z-* tokens): `.btn-primary`, `.btn-ghost`, `.card`, `.kicker`,
  `.display`, `.field`/`.input`, `.chip`/`.chip-on`, `.tone-*`.
- **Design instruction from the project owner** (verbatim, from git
  history): *"use very little colours... nice glow when selected, not
  overly glowed"* — selected/active states use a soft tonal glow
  (`shadow-glow` token: `0 0 0 3px rgba(15,61,45,0.10), 0 4px 16px
  rgba(15,61,45,0.16)`), not flat solid fills or hard borders.
- **Pattern**: pages are white/`z-page` background with dark ink text and
  green accents — NOT a full dark-green theme. Full green is reserved for
  bookends (footer bands, login-page side panels), not the whole page. An
  earlier all-dark-green redesign of `zomo-portal` was explicitly rejected
  by the owner as "too ugly."
- Grok (`zoomo-eats-grok`) has its own parallel but consistent token set in
  `src/styles.css` (`--color-primary: #0f3d2d`, `--color-accent: #1f7a52` —
  same colors, CSS custom properties instead of Tailwind config).

## Brand voice

- Wordmark: "Zoomo Eats". Mark assets at `public/brand/mark-on-white.png`
  (and `mark-on-green.png` where present).
- Tagline: "Zoom it. Eat it. Love it."
- Town: Jourian (grok's copy leans into "one town" positioning — "We don't
  leave town, so the bag is still hot.")

## Running everything locally

```bash
# 1. Postgres must be running, db "zoomo" already migrated.
cd backend && npm run start:dev              # :3000

# 2. Each frontend (separate terminals/processes):
cd zoomo-eats-grok && npm run dev            # :5173 (has its own dev script w/ env wrapper)
cd zomo-driver-app && npx vite --port 5174 --strictPort
cd zomo-merchant-app && npx vite --port 5175 --strictPort
cd zomo-admin-app && npx vite --port 5176 --strictPort
cd zomo-portal && npx vite --port 5180 --strictPort
```

Each frontend's `.env` has `VITE_API_URL=http://localhost:3000` (driver app
also has `VITE_API_BASE_URL`, same value).

**Gotcha**: after editing a `tailwind.config.js` or `.env` in any of these
apps, the Vite dev server needs a hard restart (kill + relaunch) — HMR does
not reliably pick up config-level changes; you'll get a page that looks
unstyled or blank until you restart.

**Gotcha (grok specifically, now fixed but know the shape of it)**: grok is
server-rendered (TanStack Start SSR). It used to fetch the real restaurant
catalog into module-level `RESTAURANTS`/`DISHES` variables (`zoomo-data.ts`)
exactly once per server process (`catalogLoaded` flag in `real-api.ts`),
not once per request. Since the dev server is one long-lived Node process,
this meant: seed/edit restaurant or dish data in the DB directly (as
opposed to through the app), and the running grok server would keep
serving the *pre-edit* snapshot indefinitely — even to a brand-new browser
tab doing a hard reload — until the grok dev server itself was killed and
restarted. Fixed 2026-09-17: `loadRealCatalog()` now always fetches fresh
instead of caching after the first success. If you ever see grok showing
data that doesn't match a fresh `curl localhost:3000/restaurants`, that's
the symptom to check for regressing.

## Recent history (most recent first, 2026-09-17 session — one long session)

1. **Full database wipe and reseed.** Deleted every restaurant, order,
   review, and user except the one merchant account that had to survive
   (Prisma FK: `Restaurant.ownerId` is required, can't delete an owner
   while their restaurant exists). Backed up to `ZOOMO/backups/` first.
   Reseeded with real data: renamed the old "Pizza Palace" demo restaurant
   to "I Love Pizza" and replaced its 7-dish placeholder menu with the
   owner's real 89-item menu; created "In The Hood Cafe" (154 items) and
   "Moonlight Cafe" (43 items, a separate business) from owner-supplied
   menus; added "Coffee Xpress," one real Jourian business verified via
   web search (the only one findable — Jourian has very little indexed
   listing data, most searches redirect to Jammu city, a different larger
   place ~30km away).
2. **Made order tracking and reorder real.** `liveStatus`/`liveProgress`/
   `rideProgress`/`etaMinutes`/`riderFinding` in `zoomo-data.ts` used to
   fall back to a fabricated elapsed-time timer (order auto-completes in
   ~2.5 minutes) whenever real status data was momentarily absent —
   removed that fallback; status now comes only from the real backend,
   pushed live over the existing `order:<id>` socket room. "Order again"
   (three separate places it appeared) used to just navigate to the
   restaurant's menu instead of calling the real, working `reorder()`
   function — fixed all three.
3. **Fixed the offers tab**: the activation toast and the sticky cart bar
   were anchored to the same screen position and rendered on top of each
   other (garbled overlapping text) — repositioned. One offer pointed at
   a restaurant deleted earlier in the session — removed. One offer image
   was a dead link — fixed.
4. **Every dish has a distinct photo within its restaurant now** — see
   "Restaurant data" above. This took a genuinely large image-sourcing
   pass (166+ verified Unsplash photos across ~15 food categories); if
   more dishes get added later, don't reuse a single photo across a whole
   category again — the owner explicitly called this out as unacceptable.
5. **Fixed a real architectural bug**: grok's SSR process cached the
   restaurant catalog forever after the first successful fetch (see the
   "Gotcha" above) — any DB-level data change was invisible until a
   manual dev-server restart. Fixed to always fetch fresh.
6. Redesigned `zomo-portal` (the landing hub) to use the real z-* design
   system: white background, green accents (not all-dark-green — that was
   tried and rejected), Satoshi font, live restaurant/menu-item counts
   pulled from `GET /restaurants` instead of hardcoded numbers, cards
   renamed to match real app names (Customer App / Merchant / Driver /
   Admin).
7. Added a marketing landing page to `zomo-driver-app` (`src/pages/Landing.jsx`,
   mounted at `/`) mirroring the pattern the merchant app already had —
   previously the driver app went straight to a login screen with no
   landing page.
8. Deleted `zomo-customer-app` (duplicate of grok's customer flow, zero
   unique uncommitted work, its missing `.gitignore` had let `node_modules`
   get committed — real bloat, now fixed).
9. Deleted grok's internal `/admin`, `/merchant`, `/driver`, `/portals`
   prototype routes and the `StaffShell` component/store methods they
   alone used (`staffLogin`, `staffLogout`, `setOrderLiveStatus`,
   `assignDriver`, `toggleDishOff`, `STAFF_ACCOUNTS`) — verified via grep
   that nothing else referenced them before removing.

Everything above except the in-flight items noted below is committed and
pushed to `origin/main` as of this doc's last update.

## Known in-progress / uncommitted work (as of this doc)

`zoomo-eats-grok/src/routes/checkout.tsx` and
`zoomo-eats-grok/src/styles.css` have **uncommitted local changes**, and
have had for the whole 2026-09-17 session — every commit made this session
deliberately excluded these two files. Two different things are mixed
together in that uncommitted diff:

1. A verified-working, already-tested fix (also from this session, also
   never committed) that made the checkout total update live when the
   quantity stepper changes — was keyed on `bag.length` (item count) so
   quantity bumps to an already-added item didn't refresh it; fixed by
   keying on a `dishId:quantity` signature instead, plus debouncing the
   backend re-quote so it doesn't race the quantity-update PATCH.
2. The project owner's own in-progress work: an "order placed" success
   modal with a checkmark-draw animation (`success-ring-pop`,
   `success-check-draw` keyframes in `styles.css`) and a `submitError`
   message path on checkout.

Don't assume either is finished-and-abandoned or safe to discard — both
are real, intentional, uncommitted work. If you need to commit checkout.tsx
changes for an unrelated reason, be careful not to silently sweep in or
revert either of these; ask first, same as any commit involving this file
this session did.

## Login credentials (dev only — obviously rotate before any real launch)

- Merchant, I Love Pizza: `owner1@zoomoeats.com` / `owner123`
- Merchant, In The Hood Cafe: `owner-moonlight@zoomoeats.com` / `owner123`
- Merchant, Moonlight Cafe: `owner-mlmoonlight@zoomoeats.com` / `owner123`
- Merchant, Coffee Xpress: `owner-coffeexpress@zoomoeats.com` / `owner123`
- **No admin or driver account exists** — both were deleted in the wipe and
  nothing recreated them. `zomo-admin-app`/`zomo-driver-app` are currently
  unusable without creating fresh accounts.
- Regular customer users: none — every non-owner account was deleted. Sign
  up fresh through grok's `/signup`.

## Things to double-check before trusting old context

- Restaurant names/ids/menu sizes — see "Restaurant data" above, this
  changed completely (full wipe) partway through the 2026-09-17 session.
  Anything referencing "Pizza Palace," "Burger Barn," "Healthy Bites,"
  "Spice Route," "Dragon Wok," "Sweet Theory," or any restaurant/dish not
  in that table is stale.
- Any mention of "the dark theme portal" — superseded, portal is white/green now.
- Any mention of grok's `/admin`, `/merchant`, `/driver`, `/portals` routes — deleted.
- Any mention of `zomo-customer-app` — deleted.
- Port numbers for each app (table above) if anything's been moved.
- The exact restaurant/dish counts in `zomo-portal`'s stats — these are
  live-fetched, so they'll differ from whatever snapshot number appears
  anywhere else in old notes.
- If grok ever seems to be serving stale restaurant/dish data after a DB
  change, see the SSR caching "Gotcha" above before assuming the data is
  wrong — check whether the grok dev server needs a restart (should no
  longer be necessary after the 2026-09-17 fix, but verify).
