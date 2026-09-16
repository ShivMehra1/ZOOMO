/**
 * Jourian is a fictional town, so Mapbox can't geocode its street/area names
 * (e.g. "Troti bazaar") — real addresses created through the app end up with
 * null lat/lng. Restaurants were seeded with real, hand-placed coordinates
 * clustered around real Jammu-area locations for each of the town's named
 * bazaars, so we derive each area's center from that seed data and use it as
 * a geocoding fallback: match the area name mentioned in the address text,
 * else fall back to the town-wide center. This is what makes distance-based
 * delivery ETAs and pricing actually work for addresses Mapbox can't place.
 */
export const JOURIAN_AREA_CENTERS: Record<string, { lat: number; lng: number }> = {
  bakore: { lat: 32.796038, lng: 74.537999 },
  dadora: { lat: 32.815954, lng: 74.551381 },
  ghadi: { lat: 32.855294, lng: 74.601831 },
  indri: { lat: 32.810732, lng: 74.608157 },
  jourian: { lat: 32.833889, lng: 74.577348 },
  maira: { lat: 32.843962, lng: 74.543942 },
  manchak: { lat: 32.80168, lng: 74.582778 },
  mandiwala: { lat: 32.840388, lng: 74.61247 },
  troti: { lat: 32.861114, lng: 74.556755 },
};

const TOWN_CENTER = (() => {
  const vals = Object.values(JOURIAN_AREA_CENTERS);
  return {
    lat: vals.reduce((s, v) => s + v.lat, 0) / vals.length,
    lng: vals.reduce((s, v) => s + v.lng, 0) / vals.length,
  };
})();

/** Resolve a free-text address to a best-guess lat/lng using the area name if present, else the town center. Never returns null — always usable for distance math. */
export function resolveJourianCoords(addressText: string): { lat: number; lng: number } {
  const lower = (addressText || "").toLowerCase();
  for (const [area, coords] of Object.entries(JOURIAN_AREA_CENTERS)) {
    if (lower.includes(area)) return coords;
  }
  return TOWN_CENTER;
}
