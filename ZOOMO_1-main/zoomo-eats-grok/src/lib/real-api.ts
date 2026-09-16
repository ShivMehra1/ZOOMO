// Bridges this frontend to the real NestJS + Postgres backend (the one also
// used by zomo-customer-app), replacing this app's own fake client-only
// "login" and static demo restaurant/dish arrays. Cart/orders/reviews are
// deliberately NOT wired here yet — see the summary given alongside this
// file's introduction for what's covered in this pass.
import { IMG, TOWN, setCatalog, type Dish, type Restaurant } from "./zoomo-data";

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:3000";

const TOKEN_KEY = "zoomo_real_token";

export function getRealToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setRealToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new ApiError(Array.isArray(message) ? message[0] : message, res.status);
  }
  return data;
}

export const realApi = {
  get: (path: string) => {
    const token = getRealToken();
    return fetch(API_BASE + path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(handle);
  },
  post: (path: string, body: unknown = {}) => {
    const token = getRealToken();
    return fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).then(handle);
  },
  patch: (path: string, body: unknown = {}) => {
    const token = getRealToken();
    return fetch(API_BASE + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).then(handle);
  },
  delete: (path: string) => {
    const token = getRealToken();
    return fetch(API_BASE + path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(handle);
  },
};

/* ── Real auth (replaces the fake, no-password-check store login) ── */
export type RealUser = { id: string; name: string; email: string; phone?: string | null; role: string };

export async function realLogin(email: string, password: string): Promise<RealUser> {
  const res = await realApi.post("/auth/login", { email, password });
  const token = res.accesstoken ?? res.access_token;
  if (!token || !res.user) throw new Error("Invalid login response");
  if (res.user.role !== "USER") throw new Error("Please use a staff login for this role");
  setRealToken(token);
  return res.user;
}

export async function realSignup(data: { name: string; email: string; password: string; phone?: string }): Promise<RealUser> {
  const res = await realApi.post("/auth/signup", data);
  const token = res.accesstoken ?? res.access_token;
  if (!token) throw new Error("Signup didn't return a token");
  setRealToken(token);
  return res.user;
}

/* ── Real restaurant/dish catalog (replaces the static demo arrays) ── */
function toRestaurant(r: any): Restaurant {
  const area = (r.address || "").split(",")[1]?.trim() || TOWN;
  return {
    id: r.id,
    name: r.name,
    description: r.description || "",
    imageUrl: r.imageUrl || IMG.restaurantFallback,
    address: r.address || "",
    area,
    cuisineType: r.cuisineType || "Various",
    priceRange: r.priceRange || "$$",
    rating: r.rating ?? 4.3,
    openingHours: r.openingHours || "",
    eta: r.etaMin ? `${r.etaMin}–${r.etaMin + 10} min` : "25–40 min",
    costForTwo: r.costForTwo ?? 400,
    phone: r.phone ?? undefined,
    etaMin: r.etaMin ?? 25,
  };
}

function toDish(d: any, restaurantId: string): Dish {
  return {
    id: d.id,
    restaurantId,
    name: d.name,
    description: d.description || "",
    price: d.price,
    imageUrl: d.imageUrl || IMG.dishFallback,
    calories: d.calories ?? undefined,
    isVegetarian: Boolean(d.isVegetarian),
    isVegan: Boolean(d.isVegan),
    isGlutenFree: Boolean(d.isGlutenFree),
    isAvailable: d.isAvailable ?? true,
    preparationTime: d.preparationTime ?? undefined,
    category: d.category ?? undefined,
    sizes: Array.isArray(d.sizes) && d.sizes.length
      ? d.sizes.map((s: any) => ({ id: s.id, label: s.label, price: s.price }))
      : undefined,
  };
}

let catalogLoaded = false;

export function isCatalogLoaded(): boolean {
  return catalogLoaded;
}

export async function loadRealCatalog(): Promise<void> {
  if (catalogLoaded) return;
  try {
    const list = await realApi.get("/restaurants");
    if (!Array.isArray(list)) return;
    const restaurants = list.map(toRestaurant);
    const dishes = list.flatMap((r: any) => (Array.isArray(r.dishes) ? r.dishes.map((d: any) => toDish(d, r.id)) : []));
    setCatalog(restaurants, dishes);
    catalogLoaded = true;
  } catch (err) {
    // Backend unreachable — keep the built-in demo catalog so the app still renders.
    console.error("[real-api] Could not load live catalog, using demo data:", err);
  }
}

/* ── Real cart ── */
export type RealCartItem = {
  id: string;
  quantity: number;
  dishId: string;
  dishSizeId: string | null;
  dish: { id: string; name: string; price: number; imageUrl: string; isVegetarian: boolean; restaurantId: string; sizes?: { id: string; label: string; price: number }[] };
};

export async function realGetCart(): Promise<RealCartItem[]> {
  const res = await realApi.get("/cart");
  return Array.isArray(res?.items) ? res.items : [];
}

export function realAddToCart(dishId: string, quantity: number, dishSizeId?: string) {
  return realApi.post("/cart/items", { dishId, quantity, dishSizeId });
}

export function realSetCartItemQty(cartItemId: string, quantity: number) {
  return realApi.patch(`/cart/items/${cartItemId}`, { quantity });
}

export function realRemoveCartItem(cartItemId: string) {
  return realApi.delete(`/cart/items/${cartItemId}`);
}

export function realClearCart() {
  return realApi.delete("/cart");
}

/* ── Real addresses ── */
export type RealAddress = { id: string; street: string; city: string; state: string; zipCode: string };

export async function realGetAddresses(): Promise<RealAddress[]> {
  const res = await realApi.get("/addresses");
  return Array.isArray(res) ? res : [];
}
export function realSaveAddress(a: { street: string; city: string; state: string; zipCode: string }) {
  return realApi.post("/addresses", { ...a, country: "India" });
}
export function realUpdateAddress(id: string, patch: Partial<{ street: string; city: string; state: string; zipCode: string }>) {
  return realApi.patch(`/addresses/${id}`, patch);
}
export function realRemoveAddress(id: string) {
  return realApi.delete(`/addresses/${id}`);
}

/* ── Real orders ── */
export async function realPlaceOrder(payload: {
  orderType: "DELIVERY" | "DINE_IN" | "TAKEAWAY";
  paymentMethod: string;
  promoCode: string | null;
  tip: number;
  addressId: string | null;
  scheduledFor: string | null;
  dropOff?: string;
  dropNote?: string;
  noCutlery?: boolean;
}) {
  return realApi.post("/orders", {
    addressId: payload.addressId,
    paymentMethod: payload.paymentMethod,
    orderType: payload.orderType === "DELIVERY" ? "DELIVERY" : "PICKUP",
    dropOffPreference: payload.dropOff || "MEET_DOOR",
    dropOffNote: payload.dropNote || null,
    includeCutlery: !payload.noCutlery,
    promoCode: payload.promoCode,
    tip: payload.tip,
    scheduledFor: payload.scheduledFor,
  });
}

export async function realGetOrders() {
  const res = await realApi.get("/orders/mine");
  return Array.isArray(res) ? res : [];
}
export function realGetOrder(id: string) {
  return realApi.get(`/orders/${id}`);
}
export function realCancelOrder(id: string) {
  return realApi.patch(`/orders/${id}/cancel`);
}
export function realRateOrder(id: string, rating: number) {
  return realApi.patch(`/orders/${id}/rate`, { rating });
}
export function realGatePing(id: string) {
  return realApi.patch(`/orders/${id}/gate-ping`);
}
export function realSetDropOff(id: string, preference: string, note?: string) {
  return realApi.patch(`/orders/${id}/drop-off`, { preference, note });
}
export function realGrantLateCredit(id: string) {
  return realApi.patch(`/orders/${id}/late-credit`);
}
export function realSendMessage(id: string, text: string) {
  return realApi.post(`/orders/${id}/messages`, { text });
}

/**
 * Backend Order -> the store's demo `Order` shape, so the existing UI (order
 * list, live tracking screen) keeps working unmodified. `statusLive` carries
 * the real backend status through `liveStatus()`/`rideProgress()` etc., which
 * already prefer it over their built-in elapsed-time simulation.
 */
export function toStoreOrder(o: any) {
  const items = (o.items ?? []).map((i: any) => ({
    dishId: i.dishId + (i.dishSizeId ? `__${i.dishSizeId}` : ""),
    restaurantId: o.restaurantId,
    name: i.dish?.name ?? "Item",
    price: i.price,
    imageUrl: i.dish?.imageUrl ?? "",
    isVegetarian: Boolean(i.dish?.isVegetarian),
    quantity: i.quantity,
  }));
  return {
    id: o.id,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurant?.name ?? "Restaurant",
    items,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee ?? 0,
    tax: o.tax ?? 0,
    discount: o.discount ?? 0,
    tip: o.tip ?? 0,
    total: o.total,
    status: o.status,
    orderType: o.orderType === "PICKUP" ? "TAKEAWAY" : "DELIVERY",
    paymentMethod: o.payment?.method ?? "COD",
    promoCode: o.promoCode ?? null,
    address: o.address ? { id: o.address.id, street: o.address.street, city: o.address.city, state: o.address.state, zipCode: o.address.zipCode } : null,
    guestCount: null,
    scheduledFor: o.scheduledFor ?? null,
    createdAt: o.createdAt,
    promisedAt: o.promisedAt ?? undefined,
    gatePingAt: o.gatePingAt ?? null,
    lateCredit: o.lateCreditApplied ?? 0,
    statusLive: o.status,
    statusAt: o.updatedAt,
    driverId: o.driverId ?? null,
    dropOff: (o.dropOffPreference ?? "MEET_DOOR") as any,
    dropNote: o.dropOffNote ?? "",
    chat: (o.messages ?? []).map((m: any) => ({ id: m.id, from: m.sender === "CUSTOMER" ? "me" : "rider", text: m.text, at: m.createdAt })),
    rating: o.rating ?? undefined,
    proofAt: null,
    noCutlery: o.includeCutlery === false,
    passUsed: false,
    realDriver: o.driver
      ? {
          name: o.driver.user?.name ?? "Rider",
          phone: o.driver.user?.phone ?? null,
          vehicleType: o.driver.vehicleType ?? "Bike",
          vehiclePlate: o.driver.vehiclePlate ?? "",
          rating: o.driver.rating ?? 4.8,
        }
      : null,
  };
}
