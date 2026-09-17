# Make zoomoeats.com live

The domain is registered and parked at Hostinger. Do **not** use Hostinger
website hosting for this app — NestJS will not run there. Keep Hostinger as
the **domain registrar + DNS** only.

```
zoomoeats.com            customer app (hungry people land here)
www.zoomoeats.com        same
kitchen.zoomoeats.com    merchant
ride.zoomoeats.com       driver
hq.zoomoeats.com         admin
api.zoomoeats.com        NestJS + dish photos (/static)
```

Phones never talk to Postgres. They talk to `api.zoomoeats.com`.

---

## 1. Database + API — Railway (one project)

You already have `backend/nixpacks.toml` for this.

1. Sign up at [railway.app](https://railway.app) → New Project → Deploy from GitHub `ShivMehra1/ZOOMO`.
2. Set **Root Directory** to `ZOOMO_1-main/backend`.
3. Add a **Postgres** plugin to the same project. Railway injects `DATABASE_URL`.
4. Variables on the API service:

```
JWT_SECRET=<long random string>
BACKEND_PUBLIC_URL=https://api.zoomoeats.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

5. Custom domain on the API service: `api.zoomoeats.com`.
6. After first deploy, from your laptop (with `DATABASE_URL` pointed at Railway):

```
cd backend
npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-platform.ts
```

Then rewrite dish photo URLs off localhost:

```
BACKEND_PUBLIC_URL=https://api.zoomoeats.com node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const from = 'http://localhost:3000';
const to = process.env.BACKEND_PUBLIC_URL;
(async () => {
  for (const model of ['restaurant', 'dish']) {
    const rows = await p[model].findMany({ select: { id: true, imageUrl: true } });
    for (const r of rows) {
      if (r.imageUrl && r.imageUrl.includes(from)) {
        await p[model].update({ where: { id: r.id }, data: { imageUrl: r.imageUrl.replaceAll(from, to) } });
      }
    }
  }
  await p.\$disconnect();
})();
"
```

Dump your local DB into Railway if you want the real Jourian menus (don't re-run `prisma db seed`):

```
pg_dump -Fc zoomo > zoomo.dump
# Railway Postgres → Connect → paste connection URL
pg_restore --no-owner --no-acl -d "$RAILWAY_DATABASE_URL" zoomo.dump
```

---

## 2. Frontends — Vercel (one GitHub repo, four projects)

At [vercel.com](https://vercel.com) → Import `ShivMehra1/ZOOMO` **four times**. Each project gets a different Root Directory and env:

| Vercel project | Root Directory | Domain | Env |
|---|---|---|---|
| customer | `ZOOMO_1-main/zoomo-eats-grok` | `zoomoeats.com` + `www` | `VITE_API_URL=https://api.zoomoeats.com` |
| kitchen | `ZOOMO_1-main/zomo-merchant-app` | `kitchen.zoomoeats.com` | `VITE_API_URL=https://api.zoomoeats.com` |
| ride | `ZOOMO_1-main/zomo-driver-app` | `ride.zoomoeats.com` | `VITE_API_URL=https://api.zoomoeats.com` |
| hq | `ZOOMO_1-main/zomo-admin-app` | `hq.zoomoeats.com` | `VITE_API_URL=https://api.zoomoeats.com` |

Framework preset: Vite. Output: `dist`.

Optional fifth project: `ZOOMO_1-main/zomo-portal` as a staff switcher — not the public homepage.

---

## 3. DNS — Hostinger

Hostinger → Domains → zoomoeats.com → DNS / Nameservers.

Vercel and Railway each show the exact record after you add the custom domain. Typical shape:

| Type | Name | Points to |
|---|---|---|
| A | `@` | Vercel IP they display (customer app) |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `kitchen` | `cname.vercel-dns.com` |
| CNAME | `ride` | `cname.vercel-dns.com` |
| CNAME | `hq` | `cname.vercel-dns.com` |
| CNAME | `api` | `xxxx.up.railway.app` |

Delete Hostinger's parking A records or the parked page stays.

Wait for SSL (usually < 30 min after DNS).

---

## 4. Smoke test

- `https://zoomoeats.com` — 4 Jourian kitchens, can sign up / log in
- `https://kitchen.zoomoeats.com` — `owner1@zoomoeats.com` / `owner123`
- `https://ride.zoomoeats.com` — `driver@zoomoeats.com` / `driver123`
- `https://hq.zoomoeats.com` — `admin@zoomoeats.com` / `admin123`
- Place a cash order. Kitchen sees the ticket. HQ can assign the rider.

Change every default password the same day it goes live.

---

## Do not

- Point the domain at Hostinger website hosting
- Run `prisma db seed` (old San Francisco demo kitchens)
- Host Postgres on a different continent from the API
- Leave `JWT_SECRET` blank or as `secret`
