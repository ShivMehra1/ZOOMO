# Zoomo Eats

Jourian-only food delivery. One town, short waits, live tracking.

Best-of Uber Eats, DoorDash, Zomato, and Swiggy — picked per feature, not cloned.

## What we took (and why)

| Feature | Winner | Why it won | In Zoomo |
| --- | --- | --- | --- |
| Live tracking | **Uber Eats** | Two-leg map (rider → shop → you), chat, drop-off, proof | Full-screen Uber-style track |
| Subscription | **DoorDash DashPass** | Free delivery, no min — honest for a small town | **Zoomo Pass** (₹0 this week) |
| Speed badge | **DoorDash** | Instant “this is fast” signal | **Zoom 15** on kitchens ≤ 20 min |
| Filters + sort | **Swiggy** | Fast / 4.5+ / Offers / Pure veg, plus sort | Restaurant list chips |
| Group order | **Swiggy** | One bag, names on items | Guest chips on the menu |
| Reorder | **Swiggy** | One tap, same bag | Past orders |
| Cutlery opt-out | **Swiggy** | Less plastic, one toggle | Checkout |
| Reviews | **Zomato** | People trust kitchens they can read | Menu + live reviews |
| Dine-in / takeaway | **Zomato** | Not everything is a ride | Checkout modes |
| Multi-bag cart | **Uber Eats** | Shop two kitchens, pay separately | Cart groups by restaurant |

Not copied: WhatsApp checkout, restaurant phone as the brand, metro-city dark patterns (min order, surge theatre).

## Apps

- **Customer** — home, kitchens, bag, checkout, Uber-style tracking
- **Kitchen** — `/merchant` (ticket board, 86 a dish)
- **Rider** — `/driver` (assigned bags, status)
- **HQ** — `/admin`
- **Portal picker** — `/portals`

Staff logins (demo):

| Role | Email | Password |
| --- | --- | --- |
| Kitchen (all shops) | `kitchen@zoomo.eats` | `zoomo123` |
| I Love Pizza | `ilp@zoomo.eats` | `zoomo123` |
| Rider Ravi | `ravi@zoomo.eats` | `zoomo123` |
| Rider Aman | `aman@zoomo.eats` | `zoomo123` |
| Admin | `admin@zoomo.eats` | `zoomo123` |

## Stack

TanStack Start + React 19, Zustand persist, Tailwind v4, Leaflet/Carto maps.

Customer state lives in `localStorage` (`zoomo-eats-customer`) so the preview works without a login wall.

## Run

```bash
npm install
npm run dev
```

Dev server binds `0.0.0.0:8080`.

## Town

Jourian and nearby villages only. Delivery fee ₹29 unless Zoomo Pass is on.

I Love Pizza is a kitchen on the platform — Zoomo is the identity, not the shop’s phone.
