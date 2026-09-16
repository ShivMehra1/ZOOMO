// Lightweight client-persisted preferences (veg-only, saved restaurants). The
// reference app persists these the same way — as plain browser state, not
// server rows — so we match that rather than adding backend models for UI
// preferences that were never server-side to begin with.

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getVegOnly() {
  return readJSON("ze_veg_only", false);
}
export function setVegOnly(value) {
  localStorage.setItem("ze_veg_only", JSON.stringify(Boolean(value)));
}

export function getFavorites() {
  return readJSON("ze_favorites", []);
}
export function toggleFavorite(restaurantId) {
  const current = getFavorites();
  const next = current.includes(restaurantId)
    ? current.filter((id) => id !== restaurantId)
    : [...current, restaurantId];
  localStorage.setItem("ze_favorites", JSON.stringify(next));
  return next;
}
