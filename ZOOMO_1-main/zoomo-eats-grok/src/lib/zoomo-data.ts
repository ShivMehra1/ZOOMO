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

const pic = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop`;

export const IMG = {
  restaurantFallback: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop",
  dishFallback: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
  pizza: pic("1513104890138-7c749659a591"),
  pizza2: pic("1604382354936-07c5d9983bd3"),
  tandoori: pic("1565299624946-b28f40a0ae38"),
  burger: "http://localhost:3000/static/eloteburgers6.jpg", // the pic() Unsplash id 404s
  cheeseburger: pic("1550547660-d9450f859349"),
  veggie: pic("1520072959219-c595dc870360"),
  fries: pic("1573080496219-bb080dd4f877"),
  wings: pic("1608039755401-742074f0548d"),
  smoothie: pic("1610970881699-44a5587cabec"),
  salad: pic("1512621776951-a57141f2eefd"),
  chowmein: pic("1585032226651-759b368d7246"),
  dumpling: pic("1563245372-f21724e3856d"),
  friedrice: pic("1603133872878-684f208fb84b"),
  biryani: pic("1563379091339-03b21ab4a4f8"),
  curry: pic("1585937421612-70a008356fbe"),
  naan: pic("1601050690597-df0568f70950"),
  paneer: pic("1567188040759-fb8a883dc6d8"),
  brownie: pic("1606313564200-e75d5e30476c"),
  tiramisu: pic("1571877227200-a0d98ea607e9"),
  icecream: pic("1497034825429-c343d7c6a68f"),
  cake: pic("1578985545062-69928b1d9587"),
  momos: pic("1534422298391-e4f8c172dddb"),
  shake: pic("1572490122747-3968b75cc699"),
  hero: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=900&fit=crop",
  heroVideo: "https://videos.pexels.com/video-files/5986794/5986794-hd_1920_1080_30fps.mp4",
};

export const TOWN = "Jourian";
export const PUNCHLINE = "Zoom it. Eat it. Love it.";
export const AREAS = ["Jourian", "Manchak", "Troti", "Ghadi", "Dadora", "Bakore", "Indri", "Mandiwala", "Maira"];
export const DEFAULT_LOCATION = "Jourian";
export const CUISINES = ["All", "Pizza", "Burgers", "Indian", "Chinese", "Healthy", "Desserts"] as const;
export const CATEGORIES = [
  { id: "Pizza", label: "Pizza", image: IMG.pizza },
  { id: "Burgers", label: "Burgers", image: IMG.burger },
  { id: "Indian", label: "Indian", image: IMG.biryani },
  { id: "Chinese", label: "Chinese", image: IMG.chowmein },
  { id: "Healthy", label: "Healthy", image: IMG.salad },
  { id: "Desserts", label: "Desserts", image: IMG.cake },
];

export let RESTAURANTS: Restaurant[] = [
  { id: "i-love-pizza", name: "I Love Pizza", description: "Jourian’s pizza counter. Choose S / M / L.", imageUrl: IMG.pizza, address: "Jourian bazaar", area: "Jourian", cuisineType: "Pizza", priceRange: "$", rating: 4.7, openingHours: "11:00 AM – 11:00 PM", coupon: "BOGO", eta: "20–30 min", costForTwo: 400, etaMin: 22 },
  { id: "pizza-palace", name: "Pizza Palace", description: "Wood-fired pies, slow sauce, and a proper Italian oven.", imageUrl: IMG.pizza2, address: "Jourian bazaar", area: "Jourian", cuisineType: "Pizza", priceRange: "$$", rating: 4.6, openingHours: "11:00 AM – 11:00 PM", coupon: "ZOOMO50", eta: "25–35 min", costForTwo: 600, phone: "9419122101", etaMin: 28 },
  { id: "burger-barn", name: "Burger Barn", description: "Smash burgers, hand-cut fries, and house pickles.", imageUrl: IMG.burger, address: "Jourian", area: "Jourian", cuisineType: "Burgers", priceRange: "$$", rating: 4.5, openingHours: "11:00 AM – 12:00 AM", eta: "20–30 min", costForTwo: 450, phone: "9906055122", etaMin: 22 },
  { id: "healthy-bites", name: "Healthy Bites", description: "Bowls, smoothies, and clean plates that still taste like lunch.", imageUrl: IMG.salad, address: "Jourian", area: "Jourian", cuisineType: "Healthy", priceRange: "$", rating: 4.8, openingHours: "8:00 AM – 9:00 PM", coupon: "HEALTHY20", eta: "18–28 min", costForTwo: 380, phone: "9796123344", etaMin: 18 },
  { id: "spice-route", name: "Spice Route", description: "North Indian thalis, dum biryani, and tandoor breads.", imageUrl: IMG.biryani, address: "Jourian", area: "Jourian", cuisineType: "Indian", priceRange: "$$", rating: 4.7, openingHours: "12:00 PM – 11:00 PM", coupon: "SPICE20", eta: "30–40 min", costForTwo: 700, phone: "9419188700", etaMin: 32 },
  { id: "dragon-wok", name: "Dragon Wok", description: "Wok hei noodles, dumplings, and late-night fried rice.", imageUrl: IMG.chowmein, address: "Jourian", area: "Jourian", cuisineType: "Chinese", priceRange: "$", rating: 4.4, openingHours: "12:00 PM – 11:30 PM", eta: "22–32 min", costForTwo: 420, phone: "7006231190", etaMin: 24, busy: true },
  { id: "sweet-theory", name: "Sweet Theory", description: "Pastry counter, gelato, and midnight chocolate.", imageUrl: IMG.cake, address: "Jourian", area: "Jourian", cuisineType: "Desserts", priceRange: "$", rating: 4.9, openingHours: "10:00 AM – 12:00 AM", coupon: "DESSERT30", eta: "15–25 min", costForTwo: 320, phone: "9419144567", etaMin: 16 },
];

function sml(s: number, m: number, l: number): DishSize[] {
  return [
    { id: "S", label: "Small", price: s },
    { id: "M", label: "Medium", price: m },
    { id: "L", label: "Large", price: l },
  ];
}

function d(
  id: string,
  restaurantId: string,
  name: string,
  description: string,
  price: number,
  imageUrl: string,
  isVegetarian: boolean,
  extra: Partial<Dish> = {},
): Dish {
  return { id, restaurantId, name, description, price, imageUrl, isVegetarian, isAvailable: true, ...extra };
}

const ILP = "i-love-pizza";

export let DISHES: Dish[] = [
  d("ilp-margherita", ILP, "Pizza Margherita Double Cheese", "Extra mozzarella on a tomato base.", 149, IMG.pizza, true, { category: "Pizza", sizes: sml(89, 149, 199) }),
  d("ilp-corn", ILP, "Cheese Corn Pizza", "Sweet corn, mozzarella, oregano.", 169, IMG.pizza2, true, { category: "Pizza", sizes: sml(119, 169, 219) }),
  d("ilp-delight", ILP, "Veg Delight Pizza", "Peppers, onion, tomato, olives.", 179, IMG.tandoori, true, { category: "Pizza", sizes: sml(129, 179, 229) }),
  d("ilp-paneer", ILP, "Paneer Tikka Pizza", "Tandoori paneer on a masala base.", 199, IMG.paneer, true, { category: "Pizza", sizes: sml(159, 199, 259) }),
  d("ilp-teekha", ILP, "Teekha Paneer Pizza", "Fiery paneer, green chilli, onion.", 199, IMG.paneer, true, { category: "Pizza", sizes: sml(159, 199, 259) }),
  d("ilp-makhani", ILP, "Paneer Makhani Pizza", "Buttery makhani and grilled paneer.", 199, IMG.pizza, true, { category: "Pizza", sizes: sml(159, 199, 259) }),
  d("ilp-deluxe", ILP, "Deluxe Veggie", "Loaded garden veg, extra cheese.", 219, IMG.salad, true, { category: "Pizza", sizes: sml(169, 219, 269) }),
  d("ilp-mush", ILP, "Mushroom Corn Pizza", "Button mushrooms, sweet corn.", 219, IMG.pizza2, true, { category: "Pizza", sizes: sml(169, 219, 269) }),
  d("ilp-burger", ILP, "Veg Burger", "Crisp patty, slaw, house sauce.", 89, IMG.veggie, true, { category: "Burgers" }),
  d("ilp-chaap", ILP, "Soya Chaap Roll", "Tandoori chaap, onion, mint.", 119, IMG.naan, true, { category: "Chaap" }),
  d("ilp-momos", ILP, "Veg Momos (8)", "Steamed, chilli oil on the side.", 99, IMG.momos, true, { category: "Momos" }),
  d("ilp-shake", ILP, "Chocolate Shake", "Thick, cold, topped with cream.", 99, IMG.shake, true, { category: "Shakes" }),
  d("pp-margherita", "pizza-palace", "Margherita", "San Marzano, fior di latte, basil.", 299, IMG.pizza, true, { category: "Pizza", calories: 280, preparationTime: 15 }),
  d("pp-pepperoni", "pizza-palace", "Pepperoni", "Cupped pepperoni, chilli honey.", 379, IMG.pizza2, false, { category: "Pizza" }),
  d("pp-tandoori", "pizza-palace", "Tandoori Chicken", "Charred chicken, peppers, pickled onion.", 429, IMG.tandoori, false, { category: "Pizza" }),
  d("pp-garlic", "pizza-palace", "Garlic Knots", "Six knots, parsley butter.", 149, IMG.naan, true, { category: "Sides" }),
  d("bb-classic", "burger-barn", "Barn Smash", "Double smash, American cheese, barn sauce.", 249, IMG.burger, false, { category: "Burgers" }),
  d("bb-cheese", "burger-barn", "Cheddar Stack", "Aged cheddar, caramelised onion.", 279, IMG.cheeseburger, false, { category: "Burgers" }),
  d("bb-veggie", "burger-barn", "Garden Patty", "Chickpea-beet patty, slaw.", 229, IMG.veggie, true, { category: "Burgers", isVegan: true }),
  d("bb-fries", "burger-barn", "Truffle Fries", "Hand-cut, rosemary salt.", 149, IMG.fries, true, { category: "Sides" }),
  d("bb-shake", "burger-barn", "Malted Shake", "Vanilla malt, whipped cream.", 159, IMG.icecream, true, { category: "Shakes" }),
  d("hb-green", "healthy-bites", "Green Power Smoothie", "Kale, banana, coconut water.", 169, IMG.smoothie, true, { category: "Drinks", isVegan: true }),
  d("hb-quinoa", "healthy-bites", "Quinoa Power Bowl", "Quinoa, avocado, tahini.", 249, IMG.salad, true, { category: "Bowls", isVegan: true }),
  d("hb-acai", "healthy-bites", "Acai Berry Bowl", "Acai, granola, berries.", 229, IMG.salad, true, { category: "Bowls" }),
  d("sr-biryani", "spice-route", "Hyderabadi Dum Biryani", "Saffron rice, bone-in chicken, raita.", 349, IMG.biryani, false, { category: "Mains" }),
  d("sr-paneer", "spice-route", "Paneer Makhani", "Butter tomato gravy, naan.", 299, IMG.paneer, true, { category: "Mains" }),
  d("sr-dal", "spice-route", "Dal Tadka Thali", "Yellow dal, jeera rice, papad.", 249, IMG.curry, true, { category: "Thali" }),
  d("sr-naan", "spice-route", "Butter Naan (2)", "Tandoor bread, garlic butter.", 89, IMG.naan, true, { category: "Breads" }),
  d("dw-chowmein", "dragon-wok", "Veg Chow Mein", "Wok noodles, cabbage, soy.", 219, IMG.chowmein, true, { category: "Noodles" }),
  d("dw-manchurian", "dragon-wok", "Chilli Chicken", "Crispy chicken, dry chilli.", 299, IMG.wings, false, { category: "Mains" }),
  d("dw-dumplings", "dragon-wok", "Prawn Dumplings", "Six steamed, chilli oil.", 269, IMG.dumpling, false, { category: "Dim sum" }),
  d("dw-friedrice", "dragon-wok", "Egg Fried Rice", "Wok rice, spring onion.", 199, IMG.friedrice, false, { category: "Rice" }),
  d("st-brownie", "sweet-theory", "Salted Brownie", "Warm dark chocolate, sea salt.", 179, IMG.brownie, true, { category: "Cakes" }),
  d("st-tiramisu", "sweet-theory", "Tiramisu Slice", "Espresso, mascarpone, cocoa.", 199, IMG.tiramisu, true, { category: "Cakes" }),
  d("st-gelato", "sweet-theory", "Pistachio Gelato", "Two scoops, waffle shard.", 159, IMG.icecream, true, { category: "Gelato" }),
  d("st-cake", "sweet-theory", "Chocolate Fudge Cake", "Triple layer, ganache.", 249, IMG.cake, true, { category: "Cakes" }),
];

export const COUPONS: Record<string, { type: string; value: number; label: string; max?: number | null }> = {
  ZOOMO50: { type: "percent", value: 50, label: "50% off", max: 120 },
  BOGO: { type: "flat", value: 80, label: "₹80 off", max: null },
  FREESHIP: { type: "ship", value: 29, label: "Free delivery", max: null },
  NEWUSER: { type: "flat", value: 80, label: "₹80 off", max: null },
};

export const OFFERS = [
  { code: "ZOOMO50", title: "50% off first bag", subtitle: "Cap ₹120. Jourian only.", expires: "This week", image: IMG.hero, restaurantId: null as string | null },
  { code: "BOGO", title: "Wed: ₹80 off pizza", subtitle: "I Love Pizza. Medium pies.", expires: "Wednesdays", image: IMG.pizza, restaurantId: "pizza-palace" },
  { code: "FREESHIP", title: "Ride on us", subtitle: "Delivery fee gone.", expires: "Always on for Pass", image: IMG.burger, restaurantId: null },
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

export const REVIEWS: Record<string, { name: string; rating: number; text: string }[]> = {
  "i-love-pizza": [
    { name: "Arjun", rating: 5, text: "Medium paneer pizza hits. Hot in 22 min to Mandiwala." },
    { name: "Sana", rating: 4, text: "Garlic bread is the move. Size picker is clear." },
  ],
  "pizza-palace": [{ name: "Rohit", rating: 5, text: "Wood-fired, not cardboard." }],
  "burger-barn": [{ name: "Meera", rating: 5, text: "Smash burger stayed crisp." }],
  "healthy-bites": [{ name: "Kabir", rating: 4, text: "Bowl was fresh." }],
  "spice-route": [{ name: "Neha", rating: 5, text: "Dum biryani like the bazaar." }],
  "dragon-wok": [{ name: "Vik", rating: 4, text: "Noodles had wok hei." }],
  "sweet-theory": [{ name: "Isha", rating: 5, text: "Tiramisu for a Tuesday." }],
};

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
  PENDING: { label: "Placed", tone: "wait" },
  CONFIRMED: { label: "Confirmed", tone: "go" },
  PREPARING: { label: "Preparing", tone: "go" },
  READYFORPICKUP: { label: "Ready", tone: "go" },
  OUTFORDELIVERY: { label: "On the way", tone: "go" },
  DELIVERED: { label: "Delivered", tone: "done" },
  CANCELLED: { label: "Cancelled", tone: "stop" },
};

export type TrackStep = { key: string; label: string; hint: string; at: number };

export const TRACK_DELIVERY: TrackStep[] = [
  { key: "PENDING", label: "Placed", hint: "Restaurant got the ticket", at: 0 },
  { key: "CONFIRMED", label: "Confirmed", hint: "They're making your food", at: 8 },
  { key: "PREPARING", label: "Preparing", hint: "On the stove now", at: 22 },
  { key: "READYFORPICKUP", label: "Picking up", hint: "Rider heading to the restaurant", at: 52 },
  { key: "OUTFORDELIVERY", label: "On the way", hint: "Bag is on the bike", at: 78 },
  { key: "DELIVERED", label: "Delivered", hint: "At your gate", at: 145 },
];

export const TRACK_PICKUP: TrackStep[] = [
  { key: "PENDING", label: "Placed", hint: "Order received", at: 0 },
  { key: "CONFIRMED", label: "Confirmed", hint: "Restaurant is on it", at: 12 },
  { key: "PREPARING", label: "Preparing", hint: "Almost plated", at: 40 },
  { key: "READYFORPICKUP", label: "Ready", hint: "Come collect", at: 95 },
  { key: "DELIVERED", label: "Completed", hint: "Picked up", at: 160 },
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
  if (nearby) return `${riderName || "Your rider"} is nearby`;
  if (status === "OUTFORDELIVERY") return `${riderName || "Your rider"} is on the way`;
  if (status === "READYFORPICKUP") return `${riderName || "Your rider"} is heading to the restaurant`;
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
export function matchesCuisine(r: Restaurant, chip: string) {
  if (chip === "All") return true;
  if (r.cuisineType.toLowerCase() === chip.toLowerCase()) return true;
  const hay = `${r.name} ${r.cuisineType} ${r.description}`.toLowerCase();
  return hay.includes(chip.toLowerCase().replace(/s$/, ""));
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
  const ids = ["ilp-paneer", "bb-classic", "hb-quinoa", "sr-biryani", "dw-dumplings", "st-brownie"];
  const known = DISHES.filter((d) => ids.includes(d.id));
  return known.length ? known : DISHES.slice(0, 6);
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
