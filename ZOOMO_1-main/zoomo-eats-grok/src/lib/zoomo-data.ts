export type DishSize = { id: string; label: string; price: number };

export type Dish = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  calories?: number | null;
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isAvailable: boolean;
  preparationTime?: number | null;
  category?: string;
  sizes?: DishSize[];
};

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  area: string;
  cuisineType: string;
  priceRange: string;
  rating: number;
  openingHours: string;
  coupon?: string;
  eta: string;
  costForTwo: number;
  phone?: string;
  etaMin?: number;
  busy?: boolean;
};

const pic = (id: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

/** Site chrome only — these URLs must not be used on any dish or restaurant cover. */
export const IMG = {
  restaurantFallback: pic("1517248135467-4c7edcad34c4", 1200, 800),
  dishFallback: pic("1512621776951-a57141f2eefd", 800, 800),
  hero: pic("1414235077428-338989a2e8c0", 1600, 900),
  heroPoster: pic("1568901346375-23c9450c58cd", 1600, 900),
  loginBg: pic("1554118811-1e0d58224f24", 1600, 900),
  signupBg: pic("1495474472287-4c7e555e841d", 1600, 900),
  trackPanel: "/Food-Delivery.jpg",
  offerZoomo50: pic("1546069901-ba9599a7e63c", 1200, 800),
  offerBogo: pic("1574071318508-1cdbab80d002", 1200, 800),
  offerFreeship: pic("1504674900247-0877df9cc836", 1200, 800),
  catPizza: pic("1565299624946-b28f40a0ae38"),
  catBurgers: pic("1520072959219-c595dc870360"),
  catPasta: pic("1621996346565-e3dbc646d9a9"),
  catMomos: pic("1534422298391-e4f8c172dddb"),
  catCoffee: pic("1511920170033-f8396924c348"),
  catShakes: pic("1572490122747-3968b75cc699"),
  catWraps: pic("1626700051175-6818013e1d4f"),
  catSandwiches: pic("1528735602780-2552fd46c7af"),
  catChinese: pic("1585032226651-759b368d7246"),
  catDesserts: pic("1578985545062-69928b1d9587"),
  heroVideo: "https://videos.pexels.com/video-files/5986794/5986794-hd_1920_1080_30fps.mp4",
};

export const TOWN = "Jourian";
export const PUNCHLINE = "Zoom it. Eat it. Love it.";
export const AREAS = ["Jourian", "Manchak", "Troti", "Ghadi", "Dadora", "Bakore", "Indri", "Mandiwala", "Maira"];
export const DEFAULT_LOCATION = "Jourian";
export const CUISINES = ["All", "Pizza", "Burgers", "Indian", "Chinese", "Healthy", "Desserts"] as const;
export const CATEGORIES = [
  { id: "Pizza", label: "Pizza", image: IMG.catPizza },
  { id: "Burgers", label: "Burgers", image: IMG.catBurgers },
  { id: "Pasta", label: "Pasta", image: IMG.catPasta },
  { id: "Momos", label: "Momos", image: IMG.catMomos },
  { id: "Coffee", label: "Coffee", image: IMG.catCoffee },
  { id: "Shakes", label: "Shakes", image: IMG.catShakes },
  { id: "Wraps", label: "Wraps", image: IMG.catWraps },
  { id: "Sandwiches", label: "Sandwiches", image: IMG.catSandwiches },
  { id: "Chinese", label: "Chinese", image: IMG.catChinese },
  { id: "Desserts", label: "Desserts", image: IMG.catDesserts },
];

export let RESTAURANTS: Restaurant[] = [];

export let DISHES: Dish[] = [];

export let COUPONS: Record<string, { type: string; value: number; label: string; max?: number | null }> = {
  ZOOMO50: { type: "percent", value: 50, label: "50% off", max: 120 },
  BOGO: { type: "flat", value: 80, label: "₹80 off", max: null },
  FREESHIP: { type: "ship", value: 29, label: "Free delivery", max: null },
  NEWUSER: { type: "flat", value: 80, label: "₹80 off", max: null },
};

export let OFFERS = [
  { code: "ZOOMO50", title: "50% off first bag", subtitle: "Cap ₹120. Jourian only.", expires: "This week", image: IMG.offerZoomo50, restaurantId: null as string | null },
  { code: "BOGO", title: "Wed: ₹80 off pizza", subtitle: "Jourian pizza.", expires: "Wednesdays", image: IMG.offerBogo, restaurantId: null },
  { code: "FREESHIP", title: "Ride on us", subtitle: "Delivery fee gone.", expires: "Always on for Pass", image: IMG.offerFreeship, restaurantId: null },
];

export const MAP_NODES = [
  { name: "Jourian", x: 50, y: 48, hub: true },
  { name: "Troti", x: 38, y: 28 },
  { name: "Ghadi", x: 68, y: 32 },
  { name: "Maira", x: 28, y: 36 },
  { name: "Mandiwala", x: 74, y: 46 },
  { name: "Dadora", x: 32, y: 62 },
  { name: "Manchak", x: 58, y: 68 },
  { name: "Indri", x: 78, y: 72 },
  { name: "Bakore", x: 22, y: 78 },
];

export const COST_FOR_TWO = 500;
export const ETA = "20–30 min";
export const DELIVERY_FEE = 29;
export const TAX_RATE = 0.05;
export const TIP_PRESETS = [0, 10, 20, 30, 50];
export const SHOP_KEEP_PCT = 90;
export const LATE_CREDIT = 40;

export const DROP_OFF = [
  { id: "MEET_DOOR" as const, label: "Meet at door", hint: "Hand it to me" },
  { id: "LEAVE_DOOR" as const, label: "Leave at door", hint: "No contact" },
  { id: "MEET_OUTSIDE" as const, label: "Meet outside", hint: "I’ll come to the gate" },
];
export type DropOff = (typeof DROP_OFF)[number]["id"];

export const FILTERS = [
  { id: "fast", label: "Zoom 15" },
  { id: "rated", label: "4.5+" },
  { id: "offers", label: "Offers" },
  { id: "veg", label: "Pure veg" },
] as const;

export const REVIEWS: Record<string, { name: string; rating: number; text: string }[]> = {};

/** Live reviews from Postgres, swapped in by loadRealCatalog(). */
export let LIVE_REVIEWS: { id: string; restaurantId: string; name: string; rating: number; text: string }[] = [];
export let RAIN_SURGE = false;

export function etaMinOf(r?: Restaurant | null) {
  if (!r) return 22;
  if (r.etaMin) return r.etaMin;
  const m = r.eta.match(/(\d+)/);
  return m ? Number(m[1]) + 4 : 22;
}

export function gateBy(mins = 22, from = Date.now()) {
  return new Date(from + mins * 60_000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export const ORDER_STATUS: Record<string, { label: string; tone: "wait" | "go" | "done" | "stop" }> = {
  PENDING: { label: "Order placed", tone: "wait" },
  CONFIRMED: { label: "Confirmed", tone: "go" },
  PREPARING: { label: "Preparing", tone: "go" },
  READYFORPICKUP: { label: "Ready", tone: "go" },
  OUTFORDELIVERY: { label: "On the way", tone: "go" },
  DELIVERED: { label: "Delivered", tone: "done" },
  CANCELLED: { label: "Cancelled", tone: "stop" },
};

export type TrackStep = { key: string; label: string; hint: string; at: number };

export const TRACK_DELIVERY: TrackStep[] = [
  { key: "PENDING", label: "Order placed", hint: "The restaurant has your order", at: 0 },
  { key: "CONFIRMED", label: "Confirmed", hint: "The restaurant accepted it", at: 8 },
  { key: "PREPARING", label: "Preparing", hint: "They are making your food", at: 22 },
  { key: "READYFORPICKUP", label: "Packed", hint: "Waiting for your driver", at: 52 },
  { key: "OUTFORDELIVERY", label: "On the way", hint: "Your driver has the order", at: 78 },
  { key: "DELIVERED", label: "Delivered", hint: "Handed over", at: 145 },
];

export const TRACK_PICKUP: TrackStep[] = [
  { key: "PENDING", label: "Order placed", hint: "The restaurant has your order", at: 0 },
  { key: "CONFIRMED", label: "Confirmed", hint: "The restaurant accepted it", at: 12 },
  { key: "PREPARING", label: "Preparing", hint: "They are making your food", at: 40 },
  { key: "READYFORPICKUP", label: "Ready", hint: "Collect from the restaurant", at: 95 },
  { key: "DELIVERED", label: "Collected", hint: "Picked up", at: 160 },
];

export function stepsFor(orderType: string): TrackStep[] {
  return orderType === "DELIVERY" ? TRACK_DELIVERY : TRACK_PICKUP;
}
export function elapsedSec(createdAt: string) {
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 1000);
}
export function normalizeStatus(s: string) {
  const map: Record<string, string> = {
    SCHEDULED: "PENDING",
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    PREPARING: "PREPARING",
    READY_FOR_PICKUP: "READYFORPICKUP",
    READYFORPICKUP: "READYFORPICKUP",
    OUT_FOR_DELIVERY: "OUTFORDELIVERY",
    OUTFORDELIVERY: "OUTFORDELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
  };
  return map[s] ?? s;
}
// Status/progress below come only from the real backend (order.status,
// pushed live over the order:<id> socket room and refetched via
// refreshOrders) — never fabricated from elapsed time. `statusLive` is set
// from the real order.status on every fetch (see real-api.ts), so it's
// only absent for a moment before the very first fetch resolves.
export function liveStatus(order: { status: string; statusLive?: string | null }) {
  if (order.status === "CANCELLED" || order.statusLive === "CANCELLED") return "CANCELLED";
  return normalizeStatus(order.statusLive || order.status);
}
export function liveProgress(order: { orderType: string; status: string; statusLive?: string | null }) {
  if (order.status === "CANCELLED") return 0;
  const steps = stepsFor(order.orderType);
  const key = liveStatus(order);
  const i = Math.max(0, steps.findIndex((s) => s.key === key));
  return Math.min(1, (i + (key === "DELIVERED" ? 1 : 0.45)) / steps.length);
}
export function rideProgress(order: { orderType: string; status: string; statusLive?: string | null; statusAt?: string | null; createdAt: string }) {
  if (order.status === "CANCELLED") return 0;
  const status = liveStatus(order);
  if (status === "DELIVERED") return 1;
  if (order.orderType !== "DELIVERY") return 0;
  // Within a real status, ease the marker forward with time-in-status —
  // motion grounded in a real status change, not a fabricated one.
  const t = elapsedSec(order.statusAt || order.createdAt);
  if (status === "PENDING" || status === "CONFIRMED") return 0.04;
  if (status === "PREPARING") return 0.12;
  if (status === "READYFORPICKUP") return Math.min(0.4, 0.2 + t / 80);
  if (status === "OUTFORDELIVERY") return Math.min(0.92, 0.45 + t / 95);
  return 0.08;
}
export function isNearby(order: Parameters<typeof rideProgress>[0]) {
  return liveStatus(order) === "OUTFORDELIVERY" && rideProgress(order) >= 0.82;
}
export function trackHeadline(status: string, riderName?: string | null, nearby?: boolean) {
  if (status === "CANCELLED") return "Order cancelled";
  if (status === "DELIVERED") return "Enjoy your food";
  if (nearby) return `${riderName || "Your driver"} is nearby`;
  if (status === "OUTFORDELIVERY") return `${riderName || "Your driver"} is on the way`;
  if (status === "READYFORPICKUP") return `${riderName || "Your driver"} is heading to the restaurant`;
  if (status === "PREPARING") return "They’re making it now";
  if (status === "CONFIRMED") return "Restaurant confirmed";
  return "We’ve got your order";
}
export function etaMinutes(order: { orderType: string; status: string; statusLive?: string | null }) {
  if (order.status === "CANCELLED") return 0;
  const status = liveStatus(order);
  if (status === "DELIVERED") return 0;
  const map: Record<string, number> = { PENDING: 22, CONFIRMED: 18, PREPARING: 14, READYFORPICKUP: 10, OUTFORDELIVERY: 8 };
  return map[status] ?? 12;
}
export function riderAssigned(status: string) {
  return ["CONFIRMED", "PREPARING", "READYFORPICKUP", "OUTFORDELIVERY", "DELIVERED"].includes(status);
}
// "Finding a rider" is real: true only while no driver has been assigned
// yet (order.realDriver is only ever populated from the actual backend
// assignment) and the order hasn't progressed past confirmation.
export function riderFinding(order: { status: string; statusLive?: string | null; realDriver?: unknown }) {
  if (order.realDriver) return false;
  const status = liveStatus(order);
  return status === "PENDING" || status === "CONFIRMED";
}
export const WHY = [
  { title: "One town. That’s it.", desc: "Zoomo only cooks for Jourian. No other city, no thin routes, no cold bags." },
  { title: "Hot at the gate", desc: "Manchak to Maira is a short ride. Food doesn’t go grey on a highway." },
  { title: "Restaurants you know", desc: "Neighbours. Ratings from people who actually live here." },
];
export function dishesFor(restaurantId: string) {
  return DISHES.filter((d) => d.restaurantId === restaurantId);
}
export function restaurantById(id: string) {
  return RESTAURANTS.find((r) => r.id === id);
}
const CRAVING_KEYS: Record<string, string[]> = {
  Pizza: ["pizza"],
  Burgers: ["burger"],
  Pasta: ["pasta"],
  Momos: ["momo"],
  Coffee: ["coffee", "frappe", "espresso"],
  Shakes: ["shake", "smoothie"],
  Wraps: ["wrap"],
  Sandwiches: ["sandwich"],
  Chinese: ["chinese", "manchurian", "chowmein", "noodle", "spring roll", "hakka"],
  Desserts: ["dessert", "cake", "brownie", "ice cream", "tiramisu", "pastry", "hot chocolate"],
};

function cravingKeys(chip: string) {
  return CRAVING_KEYS[chip] || [chip.toLowerCase().replace(/s$/, "")];
}

function dishMatchesCraving(d: Dish, chip: string) {
  const keys = cravingKeys(chip);
  const hay = `${d.name} ${d.category || ""} ${d.description}`.toLowerCase();
  return keys.some((k) => hay.includes(k));
}

export function dishesMatchingCraving(chip: string) {
  if (chip === "All") return [];
  return DISHES.filter((d) => d.isAvailable !== false && dishMatchesCraving(d, chip));
}

export function matchesCuisine(r: Restaurant, chip: string) {
  if (chip === "All") return true;
  const keys = cravingKeys(chip);
  const restaurantHay = `${r.name} ${r.cuisineType} ${r.description}`.toLowerCase();
  if (keys.some((k) => restaurantHay.includes(k))) return true;
  return DISHES.some((d) => d.restaurantId === r.id && dishMatchesCraving(d, chip));
}
export const RIDERS = [
  { id: "ravi", name: "Ravi Singh", phone: "9876543110", bike: "TVS Apache", plate: "JK02 AB 4412", rating: 4.9 },
  { id: "aman", name: "Aman Sharma", phone: "9906022811", bike: "Hero Splendor", plate: "JK02 CD 1904", rating: 4.8 },
  { id: "vikram", name: "Vikram Dogra", phone: "9419155670", bike: "Honda Activa", plate: "JK02 EF 7721", rating: 4.7 },
] as const;
export function riderFor(orderId: string) {
  const n = orderId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return RIDERS[n % RIDERS.length];
}
export function riderById(id?: string | null) {
  if (!id) return null;
  return RIDERS.find((r) => r.id === id) ?? null;
}
export function mapNode(name?: string | null) {
  const hub = MAP_NODES.find((n) => n.hub) ?? MAP_NODES[0];
  if (!name) return hub;
  return MAP_NODES.find((n) => name.toLowerCase().includes(n.name.toLowerCase())) ?? hub;
}
export function routePath(fromName?: string | null, toName?: string | null) {
  const a = mapNode(fromName);
  const b = mapNode(toName);
  const hub = MAP_NODES.find((n) => n.hub) ?? a;
  if (a.name === b.name) return `M${a.x} ${a.y} c 6 -8, 14 -8, 16 0`;
  return `M${a.x} ${a.y} Q ${hub.x} ${hub.y} ${b.x} ${b.y}`;
}
export function inr(n: number) {
  return `₹${Math.round(n)}`;
}
export function popularDishes() {
  return DISHES.filter((d) => d.isAvailable !== false).slice(0, 8);
}

/**
 * Swap the in-memory catalog for real backend data. RESTAURANTS/DISHES are
 * `let`-exported ES module bindings, so every module that imported them sees
 * this update live — no need to touch the ~15 components that read them.
 */
export function setCatalog(restaurants: Restaurant[], dishes: Dish[]) {
  RESTAURANTS = restaurants;
  DISHES = dishes;
}

export function setPromos(
  coupons: Record<string, { type: string; value: number; label: string; max?: number | null }>,
  offers: typeof OFFERS,
) {
  COUPONS = coupons;
  OFFERS = offers;
}

export function setLiveReviews(rows: typeof LIVE_REVIEWS) {
  LIVE_REVIEWS = rows;
}

export function setRainSurge(on: boolean) {
  RAIN_SURGE = on;
}
