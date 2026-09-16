export type LatLng = { lat: number; lng: number };

/** Jourian town + nearby areas. All in Jammu district, India. */
export const AREA_GEO: Record<string, LatLng> = {
  Jourian: { lat: 32.834, lng: 74.577 },
  Troti: { lat: 32.842, lng: 74.57 },
  Ghadi: { lat: 32.839, lng: 74.586 },
  Maira: { lat: 32.841, lng: 74.564 },
  Mandiwala: { lat: 32.836, lng: 74.591 },
  Dadora: { lat: 32.829, lng: 74.566 },
  Manchak: { lat: 32.827, lng: 74.581 },
  Indri: { lat: 32.824, lng: 74.588 },
  Bakore: { lat: 32.822, lng: 74.571 },
};

export const JOURIAN_BOUNDS: [[number, number], [number, number]] = [
  [32.805, 74.548],
  [32.86, 74.612],
];

export function geoOf(name?: string | null): LatLng {
  if (!name) return AREA_GEO.Jourian;
  const hit = Object.keys(AREA_GEO).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return AREA_GEO[hit ?? "Jourian"];
}

export function rideFromTo(a: LatLng, b: LatLng, steps = 48): LatLng[] {
  let dest = b;
  if (Math.abs(b.lng - a.lng) < 0.0006 && Math.abs(b.lat - a.lat) < 0.0006) {
    dest = { lat: a.lat - 0.0044, lng: a.lng + 0.0058 };
  }
  const c: LatLng = {
    lat: (a.lat + dest.lat) / 2 + (dest.lng - a.lng) * 0.38,
    lng: (a.lng + dest.lng) / 2 - (dest.lat - a.lat) * 0.38,
  };
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      lat: u * u * a.lat + 2 * u * t * c.lat + t * t * dest.lat,
      lng: u * u * a.lng + 2 * u * t * c.lng + t * t * dest.lng,
    });
  }
  return pts;
}

export function rideRoute(fromName?: string | null, toName?: string | null, steps = 56): LatLng[] {
  return rideFromTo(geoOf(fromName), geoOf(toName), steps);
}

export function pointOnRoute(route: LatLng[], t: number): LatLng {
  if (!route.length) return AREA_GEO.Jourian;
  if (route.length === 1) return route[0];
  const x = Math.max(0, Math.min(1, t)) * (route.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = route[i];
  const b = route[Math.min(i + 1, route.length - 1)];
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}

export function bearing(a: LatLng, b: LatLng) {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function kmBetween(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function spawnNear(shop: LatLng): LatLng {
  return { lat: shop.lat + 0.0042, lng: shop.lng - 0.0055 };
}

/** Two-leg Uber path: rider spawn → restaurant → you. */
export function uberLegs(shopName?: string | null, youName?: string | null) {
  const shop = geoOf(shopName);
  const you = geoOf(youName);
  const spawn = spawnNear(shop);
  const toShopPts = rideFromTo(spawn, shop, 36);
  const toYouPts = rideFromTo(shop, you, 48);
  return { spawn, shop, you, toShop: toShopPts, toYou: toYouPts, full: [...toShopPts, ...toYouPts] };
}

export function posOnLegs(
  toShop: LatLng[],
  toYou: LatLng[],
  ride: number,
): { pos: LatLng; nxt: LatLng; leg: "toShop" | "toYou" | "done" } {
  const split = 0.42;
  if (ride >= 0.995) {
    const last = toYou[toYou.length - 1];
    return { pos: last, nxt: last, leg: "done" };
  }
  if (ride <= split) {
    const t = ride / split;
    const pos = pointOnRoute(toShop, t);
    const nxt = pointOnRoute(toShop, Math.min(1, t + 0.05));
    return { pos, nxt, leg: "toShop" };
  }
  const t = (ride - split) / (1 - split);
  const pos = pointOnRoute(toYou, t);
  const nxt = pointOnRoute(toYou, Math.min(1, t + 0.04));
  return { pos, nxt, leg: "toYou" };
}
