import catalog from "../data/jourian-catalog.json";

export const JOURIAN_KITCHENS = catalog.restaurants;

const FAKE_EMAILS = new Set([
  "customer@zoomoeats.com",
  "owner1@zoomoeats.com",
  "owner2@zoomoeats.com",
  "owner3@zoomoeats.com",
  "owner@example.com",
  "test@test.com",
  "demo@zoomoeats.com",
]);

const FAKE_NAME_RE =
  /^(john customer|mike driver|pizza palace owner|burger barn owner|healthy bites owner|xyzad|qwdsasa|122321|ghvghjv|test user|demo user|burger best)$/i;

const FAKE_KITCHEN_RE =
  /^(pizza palace|burger barn|healthy bites|xyzad|qwdsasa|122321|burger best|rfc(\s+fast\s+food)?)$/i;

export function isFakeUser(u = {}) {
  const email = String(u.email || "").trim().toLowerCase();
  const name = String(u.name || "").trim();
  if (FAKE_EMAILS.has(email)) return true;
  if (FAKE_NAME_RE.test(name)) return true;
  if (email && !email.includes("@")) return true;
  if (/^owner\d+@/i.test(email)) return true;
  if (/^test\d*@/i.test(email)) return true;
  return false;
}

export function isFakeKitchenName(name) {
  const n = String(name || "").trim();
  if (/^pizza palace$/i.test(n)) return false; // historic name of I Love Pizza
  return FAKE_KITCHEN_RE.test(n);
}

export function displayKitchenName(name) {
  const n = String(name || "").trim();
  if (/^pizza palace$/i.test(n)) return "I Love Pizza";
  return n;
}

export function kitchenIdForName(name) {
  const n = displayKitchenName(name).toLowerCase();
  const hit = JOURIAN_KITCHENS.find((k) => k.name.toLowerCase() === n);
  return hit?.id || null;
}

const HIDDEN_KEY = "zoomo_hidden_users";

export function hiddenUserIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function hideUser(id) {
  const next = hiddenUserIds();
  next.add(id);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
}

export function hideUsers(ids) {
  const next = hiddenUserIds();
  ids.forEach((id) => next.add(id));
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next]));
}

export function filterRealUsers(users) {
  const hidden = hiddenUserIds();
  return (users || []).filter((u) => u && !hidden.has(u.id) && !isFakeUser(u));
}

export function usersFromOrders(orders) {
  const map = new Map();
  for (const o of orders || []) {
    const u = o.user;
    if (!u?.id) continue;
    const row = map.get(u.id) || {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: "USER",
      isSuspended: false,
      orderCount: 0,
      createdAt: o.createdAt,
    };
    row.orderCount += 1;
    map.set(u.id, row);
  }
  return filterRealUsers([...map.values()]);
}

export function enrichJourianRestaurants(orders) {
  const counts = {};
  const revenue = {};
  for (const o of orders || []) {
    if (o.status === "CANCELLED") continue;
    const name = displayKitchenName(o.restaurant?.name);
    const id = kitchenIdForName(name);
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
    revenue[id] = (revenue[id] || 0) + Number(o.total || 0);
  }
  return JOURIAN_KITCHENS.map((k) => ({
    ...k,
    owner: { name: `${k.name} owner`, email: null },
    orderCount: counts[k.id] || 0,
    revenue: revenue[k.id] || 0,
    dishCount: catalog.dishes.filter((d) => d.restaurantId === k.id).length,
    isApproved: true,
    isActive: true,
  }));
}

export function realOrders(orders) {
  return (orders || [])
    .filter((o) => !isFakeUser(o.user) && !isFakeKitchenName(o.restaurant?.name))
    .map((o) => ({
      ...o,
      restaurant: o.restaurant
        ? { ...o.restaurant, name: displayKitchenName(o.restaurant.name) }
        : o.restaurant,
    }));
}
