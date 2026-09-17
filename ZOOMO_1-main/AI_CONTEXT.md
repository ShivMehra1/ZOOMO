# Zoomo — AI Context / Handoff Doc

This file exists so a fresh AI session (any model — Grok, Claude, etc.) can
get oriented in this repo in one read, without re-deriving what's already
been figured out. Written 2026-09-17. Keep it updated as the project moves;
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

## Recent history (most recent first, 2026-09-17 session)

1. Redesigned `zomo-portal` (the landing hub) to use the real z-* design
   system: white background, green accents (not all-dark-green — that was
   tried and rejected), Satoshi font, live restaurant/menu-item counts
   pulled from `GET /restaurants` instead of hardcoded numbers, cards
   renamed to match real app names (Customer App / Merchant / Driver /
   Admin).
2. Added a marketing landing page to `zomo-driver-app` (`src/pages/Landing.jsx`,
   mounted at `/`) mirroring the pattern the merchant app already had —
   previously the driver app went straight to a login screen with no
   landing page.
3. Deleted `zomo-customer-app` (duplicate of grok's customer flow, zero
   unique uncommitted work, its missing `.gitignore` had let `node_modules`
   get committed — real bloat, now fixed).
4. Deleted grok's internal `/admin`, `/merchant`, `/driver`, `/portals`
   prototype routes and the `StaffShell` component/store methods they
   alone used (`staffLogin`, `staffLogout`, `setOrderLiveStatus`,
   `assignDriver`, `toggleDishOff`, `STAFF_ACCOUNTS`) — verified via grep
   that nothing else referenced them before removing.

All of the above is committed and pushed to `origin/main`.

## Known in-progress / uncommitted work (as of this doc)

`zoomo-eats-grok/src/routes/checkout.tsx` and
`zoomo-eats-grok/src/styles.css` have **uncommitted local changes** — an
in-progress "order placed" success modal with a checkmark-draw animation
(`success-ring-pop`, `success-check-draw` keyframes) and a `submitError`
message path on checkout. This is the project owner's own in-progress work,
not finished/committed by design — don't assume it's done, and don't
commit it on their behalf without asking.

## Things to double-check before trusting old context

- Any mention of "the dark theme portal" — superseded, portal is white/green now.
- Any mention of grok's `/admin`, `/merchant`, `/driver`, `/portals` routes — deleted.
- Any mention of `zomo-customer-app` — deleted.
- Port numbers for each app (table above) if anything's been moved.
- The exact restaurant/dish counts in `zomo-portal`'s stats — these are
  live-fetched, so they'll differ from whatever snapshot number appears
  anywhere else in old notes.
