import { DISHES, etaMinOf, type Dish, type Restaurant } from "./zoomo-data";
import { daypart } from "./hours";
import type { Order } from "./zoomo-store";

export type TasteInput = {
  orders: Order[];
  favorites: string[];
  vegOnly?: boolean;
  visits?: Record<string, number>;
};

export type RankedKitchen = {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
  urgency: string | null;
};

function avgSpend(orders: Order[]): number {
  if (!orders.length) return 280;
  const totals = orders.map((o) => o.total || 0).filter((n) => n > 0);
  if (!totals.length) return 280;
  return totals.reduce((s, n) => s + n, 0) / totals.length;
}

function cuisineCounts(orders: Order[], restaurants: Restaurant[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const r = restaurants.find((x) => x.id === o.restaurantId);
    const key = (r?.cuisineType || "").split(",")[0]?.trim();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function daysSince(iso?: string) {
  if (!iso) return 99;
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function rankKitchens(all: Restaurant[], taste: TasteInput): RankedKitchen[] {
  const spend = avgSpend(taste.orders);
  const cuisines = cuisineCounts(taste.orders, all);
  const lastAt = new Map<string, string>();
  for (const o of taste.orders) {
    if (!lastAt.has(o.restaurantId) || (o.createdAt && o.createdAt > (lastAt.get(o.restaurantId) || ""))) {
      lastAt.set(o.restaurantId, o.createdAt);
    }
  }
  const part = daypart();

  return all
    .map((r) => {
      const reasons: string[] = [];
      let score = r.rating * 4;
      const visits = taste.visits?.[r.id] || 0;
      if (visits) {
        score += Math.min(30, visits * 8);
        reasons.push("You order here");
      }
      if (taste.favorites.includes(r.id)) {
        score += 22;
        reasons.push("Saved");
      }
      const pref = [...cuisines.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (pref && r.cuisineType.toLowerCase().includes(pref.toLowerCase())) {
        score += 14;
        reasons.push(`Your ${pref.toLowerCase()}`);
      }
      if (taste.vegOnly && DISHES.some((d) => d.restaurantId === r.id && d.isVegetarian)) score += 6;

      if (spend < 250 && r.costForTwo <= 350) {
        score += 16;
        reasons.push("Wallet-friendly");
      } else if (spend >= 400 && r.costForTwo >= 450) {
        score += 12;
        reasons.push("Your usual spend");
      }

      const last = daysSince(lastAt.get(r.id));
      if (last < 4) score += 10;
      else if (last > 14 && visits) {
        score += 8;
        reasons.push("Been a while");
      }

      if (part === "lunch" && /pizza|burger|chinese|indian/i.test(r.cuisineType)) score += 4;
      if (part === "late" && /pizza|burger|biryani|chinese/i.test(r.cuisineType)) score += 6;

      const eta = etaMinOf(r);
      if (eta <= 22) {
        score += 8;
        reasons.push(`Gate in ${eta} min`);
      }

      return { restaurant: r, score, reasons: reasons.slice(0, 2), urgency: null };
    })
    .sort((a, b) => b.score - a.score);
}

export function dishesForYou(taste: TasteInput, limit = 8): Dish[] {
  const counts = new Map<string, { n: number; last: number; price: number }>();
  for (const o of taste.orders) {
    for (const i of o.items) {
      const id = i.dishId.split("__")[0];
      const prev = counts.get(id) || { n: 0, last: 0, price: i.price };
      counts.set(id, {
        n: prev.n + i.quantity,
        last: Math.max(prev.last, new Date(o.createdAt).getTime() || 0),
        price: i.price,
      });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].n * 10 + b[1].last / 1e12 - (a[1].n * 10 + a[1].last / 1e12))
    .map(([id]) => DISHES.find((d) => d.id === id))
    .filter((d): d is Dish => Boolean(d) && (!taste.vegOnly || d.isVegetarian))
    .slice(0, limit);
}

export function walletDishes(taste: TasteInput, limit = 8): Dish[] {
  const cap = Math.max(80, avgSpend(taste.orders) * 0.45);
  return DISHES.filter((d) => d.price <= cap && (!taste.vegOnly || d.isVegetarian))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

export function treatDishes(taste: TasteInput, limit = 8): Dish[] {
  const floor = Math.max(220, avgSpend(taste.orders) * 0.7);
  return DISHES.filter((d) => d.price >= floor && (!taste.vegOnly || d.isVegetarian))
    .sort((a, b) => b.price - a.price)
    .slice(0, limit);
}
