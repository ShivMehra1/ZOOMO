// Bridges this frontend to the real NestJS + Postgres backend. Menus, cart,
// orders, and reviews all use live dish/restaurant ids from GET /restaurants.
import { IMG, TOWN, setCatalog, setLiveReviews, setPromos, type Dish, type Restaurant } from "./zoomo-data";
import { getApiBase, publicMedia } from "./api-base";

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
  code?: string;
  payload?: unknown;
  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

async function handle(res: Response) {
  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(text.slice(0, 160) || `Request failed (${res.status})`, res.status);
    }
  }
  if (!res.ok) {
    const raw = data && (data.message || data.error);
    const message = Array.isArray(raw) ? raw[0] : typeof raw === "string" ? raw : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data?.code, data);
  }
  return data;
}

export const realApi = {
  get: (path: string) => {
    const token = getRealToken();
    return fetch(getApiBase() + path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(handle);
  },
  post: (path: string, body: unknown = {}) => {
    const token = getRealToken();
    return fetch(getApiBase() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).then(handle);
  },
  patch: (path: string, body: unknown = {}) => {
    const token = getRealToken();
    return fetch(getApiBase() + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }).then(handle);
  },
  delete: (path: string) => {
    const token = getRealToken();
    return fetch(getApiBase() + path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(handle);
  },
};

/* ── Real auth (replaces the fake, no-password-check store login) ── */
export type RealUser = { id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null; role: string };

export async function realGetProfile(): Promise<RealUser> {
  return realApi.get("/users/me");
}

export async function realUpdateProfile(patch: { name?: string; phone?: string; avatarUrl?: string }): Promise<RealUser> {
  return realApi.patch("/users/me", patch);
}

export async function realUploadAvatar(file: File): Promise<{ url: string }> {
  const token = getRealToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${getApiBase()}/upload/image?folder=avatars`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handle(res);
}

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

/* ── Mobile OTP (dev-mode: the code is returned directly, not texted — no SMS provider configured) ── */
export async function realRequestOtp(phone: string): Promise<{ devCode: string }> {
  return realApi.post("/auth/otp/request", { phone });
}

export async function realVerifyOtp(phone: string, code: string, name?: string): Promise<RealUser> {
  const res = await realApi.post("/auth/otp/verify", { phone, code, name });
  const token = res.accesstoken ?? res.access_token;
  if (!token || !res.user) throw new Error("Invalid verification response");
  setRealToken(token);
  return res.user;
}

/* ── Google sign-in (dev-mode: trusts client-supplied email/name — see backend for the real-verification hook) ── */
export async function realGoogleAuth(email: string, name: string): Promise<RealUser> {
  const res = await realApi.post("/auth/google", { email, name });
  const token = res.accesstoken ?? res.access_token;
  if (!token || !res.user) throw new Error("Invalid Google sign-in response");
  setRealToken(token);
  return res.user;
}

/* ── Real restaurant/dish catalog — whatever GET /restaurants returns ── */
export type CatalogPayload = {
  restaurants: Restaurant[];
  dishes: Dish[];
  reviews: { id: string; restaurantId: string; name: string; rating: number; text: string }[];
  coupons: Record<string, { type: string; value: number; label: string; max?: number | null }>;
  offers: { code: string; title: string; subtitle: string; expires: string; image: string; restaurantId: string | null }[];
};

function toRestaurant(r: any): Restaurant {
  const area = (r.address || "").split(",")[1]?.trim() || TOWN;
  return {
    id: r.id,
    name: String(r.name || "").trim(),
    description: r.description || "",
    imageUrl: publicMedia(r.imageUrl, IMG.restaurantFallback),
    address: r.address || "",
    area,
    cuisineType: r.cuisineType || "Various",
    priceRange: r.priceRange || "$$",
    rating: Number(r.rating) || 4.3,
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
    imageUrl: publicMedia(d.imageUrl, IMG.dishFallback),
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

export function applyCatalog(payload?: CatalogPayload | null) {
  if (!payload) return;
  setCatalog(payload.restaurants, payload.dishes);
  setLiveReviews(payload.reviews);
  if (payload.offers.length) setPromos(payload.coupons, payload.offers);
  catalogLoaded = true;
}

let catalogLoaded = false;

export function isCatalogLoaded(): boolean {
  return catalogLoaded;
}

function emptyCatalog(): CatalogPayload {
  return { restaurants: [], dishes: [], reviews: [], coupons: {}, offers: [] };
}

export async function loadRealCatalog(): Promise<CatalogPayload> {
  const payload = emptyCatalog();
  try {
    let rows: any = null;
    for (let attempt = 0; attempt < 3 && !rows; attempt++) {
      try {
        rows = await realApi.get("/restaurants");
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    if (Array.isArray(rows)) {
      for (const r of rows) {
        payload.restaurants.push(toRestaurant(r));
        for (const d of r.dishes || []) {
          payload.dishes.push(toDish(d, r.id));
        }
        for (const rv of r.reviews || []) {
          payload.reviews.push({
            id: rv.id,
            restaurantId: r.id,
            name: rv.user?.name || "Neighbour",
            rating: Number(rv.rating) || 0,
            text: rv.comment || rv.text || "",
          });
        }
      }
    }
  } catch (err) {
    // Never fall back to the bundled slug catalog — those dish ids are not
    // in Postgres, so Add-to-bag would 404. Empty is better than broken.
    console.error("[catalog] live restaurants failed", err);
  }

  try {
    const offers = await realApi.get("/offers").catch(() => []);
    if (Array.isArray(offers) && offers.length) {
      const offerImages = [IMG.offerZoomo50, IMG.offerBogo, IMG.offerFreeship];
      for (const o of offers) {
        const type = o.discountType === "FLAT" ? "flat" : o.discountType === "FREE_DELIVERY" ? "ship" : "percent";
        payload.coupons[o.code] = {
          type,
          value: Number(o.value) || 0,
          label: o.title || o.code,
          max: o.maxDiscount ?? null,
        };
        payload.offers.push({
          code: o.code,
          title: o.title || o.code,
          subtitle: o.subtitle || "Jourian",
          expires: o.expires || "Always on",
          image: offerImages[payload.offers.length] || "",
          restaurantId: o.restaurantId ?? null,
        });
      }
    }
  } catch {
    /* offers are optional */
  }
  applyCatalog(payload);
  return payload;
}

/* ── Real cart ── */
export type RealCartItem = {
  id: string;
  quantity: number;
  dishId: string;
  dishSizeId: string | null;
  specialInstructions?: string | null;
  dish: { id: string; name: string; price: number; imageUrl: string; isVegetarian: boolean; restaurantId: string; sizes?: { id: string; label: string; price: number }[] };
};

function cartItemsOf(res: any): RealCartItem[] {
  return Array.isArray(res?.items) ? res.items : [];
}

export async function realGetCart(): Promise<RealCartItem[]> {
  return cartItemsOf(await realApi.get("/cart"));
}

export async function realAddToCart(
  dishId: string,
  quantity: number,
  dishSizeId?: string,
  specialInstructions?: string,
  replace?: boolean,
): Promise<RealCartItem[]> {
  return cartItemsOf(
    await realApi.post("/cart/items", { dishId, quantity, dishSizeId, specialInstructions, replace: Boolean(replace) }),
  );
}

export async function realSetCartItemQty(cartItemId: string, quantity: number, specialInstructions?: string) {
  return cartItemsOf(await realApi.patch(`/cart/items/${cartItemId}`, { quantity, specialInstructions }));
}

export async function realRemoveCartItem(cartItemId: string) {
  return cartItemsOf(await realApi.delete(`/cart/items/${cartItemId}`));
}

export async function realClearCart() {
  return cartItemsOf(await realApi.delete("/cart"));
}
export async function realClearRestaurantCart(restaurantId: string) {
  return cartItemsOf(await realApi.delete(`/cart/restaurant/${encodeURIComponent(restaurantId)}`));
}

/* ── Real addresses ── */
export type RealAddress = {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number | null;
  lng?: number | null;
};

export async function realGetAddresses(): Promise<RealAddress[]> {
  const res = await realApi.get("/addresses");
  return Array.isArray(res) ? res : [];
}
export function realSaveAddress(a: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
}) {
  return realApi.post("/addresses", { ...a, country: "India" });
}
export function realUpdateAddress(id: string, patch: Partial<{ street: string; city: string; state: string; zipCode: string }>) {
  return realApi.patch(`/addresses/${id}`, patch);
}
export function realRemoveAddress(id: string) {
  return realApi.delete(`/addresses/${id}`);
}

/* ── Real favorites ── */
export async function realGetFavorites(): Promise<Restaurant[]> {
  const res = await realApi.get("/favorites");
  return Array.isArray(res) ? res.map(toRestaurant) : [];
}
export function realAddFavorite(restaurantId: string) {
  return realApi.post(`/favorites/${restaurantId}`);
}
export function realRemoveFavorite(restaurantId: string) {
  return realApi.delete(`/favorites/${restaurantId}`);
}

export function realAddReview(restaurantId: string, rating: number, comment: string) {
  return realApi.post(`/restaurants/${restaurantId}/reviews`, { rating, comment });
}

/* ── Real search ── */
export async function realSearchRestaurants(q: string): Promise<Restaurant[]> {
  if (!q.trim()) return [];
  const res = await realApi.get(`/restaurants/search?q=${encodeURIComponent(q)}`);
  return Array.isArray(res) ? res.map(toRestaurant) : [];
}
export async function realSearchDishes(q: string): Promise<Dish[]> {
  if (!q.trim()) return [];
  const res = await realApi.get(`/dishes/search?q=${encodeURIComponent(q)}`);
  return Array.isArray(res) ? res.map((d: any) => toDish(d, d.restaurantId ?? d.restaurant?.id)) : [];
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
  restaurantId?: string;
}) {
  return realApi.post("/orders", {
    addressId: payload.addressId,
    paymentMethod: payload.paymentMethod,
    restaurantId: payload.restaurantId,
    orderType:
      payload.orderType === "DELIVERY" ? "DELIVERY" : payload.orderType === "DINE_IN" ? "DINE_IN" : "PICKUP",
    dropOffPreference: payload.dropOff || "MEET_DOOR",
    dropOffNote: payload.dropNote || null,
    includeCutlery: !payload.noCutlery,
    promoCode: payload.promoCode,
    tip: payload.tip,
    scheduledFor: payload.scheduledFor,
  });
}

export type OrderQuote = {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  distanceKm: number | null;
  kmSlab: "near" | "town" | "far" | null;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
};

export async function realQuoteOrder(payload: {
  orderType: "DELIVERY" | "DINE_IN" | "TAKEAWAY";
  addressId: string | null;
  promoCode: string | null;
  tip: number;
  restaurantId?: string;
}): Promise<OrderQuote> {
  return realApi.post("/orders/quote", {
    addressId: payload.addressId,
    restaurantId: payload.restaurantId,
    orderType:
      payload.orderType === "DELIVERY" ? "DELIVERY" : payload.orderType === "DINE_IN" ? "DINE_IN" : "PICKUP",
    promoCode: payload.promoCode,
    tip: payload.tip,
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
export function realRateOrder(id: string, rating: number, comment?: string) {
  return realApi.patch(`/orders/${id}/rate`, { rating, comment: comment || undefined });
}
export function realRateDriver(id: string, rating: number, comment?: string) {
  return realApi.patch(`/orders/${id}/rate-driver`, { rating, comment: comment || undefined });
}
export function realExtraTip(id: string, amount: number) {
  return realApi.patch(`/orders/${id}/extra-tip`, { amount });
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

/* ── Staff (driver/merchant/admin) — separate token keys per role so a
 * staff session never clobbers the customer session token or each other. ── */
function makeStaffApi(tokenKey: string) {
  const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(tokenKey));
  const setToken = (t: string | null) => {
    if (typeof window === "undefined") return;
    if (t) localStorage.setItem(tokenKey, t);
    else localStorage.removeItem(tokenKey);
  };
  const req = (method: string, path: string, body?: unknown) => {
    const token = getToken();
    return fetch(getApiBase() + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(handle);
  };
  return {
    getToken,
    setToken,
    get: (path: string) => req("GET", path),
    post: (path: string, body?: unknown) => req("POST", path, body),
    patch: (path: string, body?: unknown) => req("PATCH", path, body),
  };
}

const driverStaffApi = makeStaffApi("zoomo_driver_token");
const merchantStaffApi = makeStaffApi("zoomo_merchant_token");
const adminStaffApi = makeStaffApi("zoomo_admin_token");

/* ── Staff: Driver (same backend as the dedicated zomo-driver-app) ── */
export async function driverRealLogin(email: string, password: string) {
  const res = await driverStaffApi.post("/driver/auth/login", { email, password });
  if (!res?.accessToken) throw new Error("Invalid driver login");
  driverStaffApi.setToken(res.accessToken);
  return res.driver as { id: string; name: string; email: string };
}
export function driverRealLogout() {
  driverStaffApi.setToken(null);
}
export function driverHasRealSession() {
  return Boolean(driverStaffApi.getToken());
}
export async function driverRealGetOrders(): Promise<any[]> {
  const res = await driverStaffApi.get("/driver/orders");
  return Array.isArray(res) ? res : [];
}
export function driverRealPickup(orderId: string) {
  return driverStaffApi.patch(`/driver/orders/${orderId}/pickup`);
}
export function driverRealDeliver(orderId: string) {
  return driverStaffApi.patch(`/driver/orders/${orderId}/deliver`);
}

/* ── Staff: Merchant (same backend as the dedicated zomo-merchant-app) ── */
export async function merchantRealLogin(email: string, password: string) {
  const res = await merchantStaffApi.post("/merchant/auth/login", { email, password });
  const token = res?.access_token ?? res?.accessToken;
  if (!token) throw new Error("Invalid merchant login");
  merchantStaffApi.setToken(token);
  return token as string;
}
export function merchantRealLogout() {
  merchantStaffApi.setToken(null);
}
export function merchantHasRealSession() {
  return Boolean(merchantStaffApi.getToken());
}
export function merchantRealGetMyRestaurant(): Promise<any> {
  return merchantStaffApi.get("/merchant/restaurants/me");
}
export async function merchantRealGetOrders(restaurantId: string): Promise<any[]> {
  const res = await merchantStaffApi.get(`/merchant/restaurants/${restaurantId}/orders`);
  return Array.isArray(res) ? res : [];
}
export function merchantRealUpdateOrderStatus(restaurantId: string, orderId: string, status: string) {
  return merchantStaffApi.patch(`/merchant/restaurants/${restaurantId}/orders/${orderId}/status`, { status });
}
export function merchantRealCancelOrder(restaurantId: string, orderId: string) {
  return merchantStaffApi.patch(`/merchant/restaurants/${restaurantId}/orders/${orderId}/cancel`);
}
export async function merchantRealGetDishes(): Promise<any[]> {
  const res = await merchantStaffApi.get("/merchant/dishes");
  return Array.isArray(res) ? res : [];
}
export function merchantRealToggleDish(dishId: string) {
  return merchantStaffApi.patch(`/merchant/dishes/${dishId}/toggle`);
}

/* ── Staff: Admin (same backend as the dedicated zomo-admin-app) ── */
export async function adminRealLogin(email: string, password: string) {
  const res = await adminStaffApi.post("/admin/auth/login", { email, password });
  if (!res?.accessToken) throw new Error("Invalid admin login");
  adminStaffApi.setToken(res.accessToken);
  return res.accessToken as string;
}
export function adminRealLogout() {
  adminStaffApi.setToken(null);
}
export function adminHasRealSession() {
  return Boolean(adminStaffApi.getToken());
}
export async function adminRealGetOrders(): Promise<any[]> {
  const res = await adminStaffApi.get("/admin/orders");
  return Array.isArray(res) ? res : [];
}
export async function adminRealGetDrivers(): Promise<any[]> {
  const res = await adminStaffApi.get("/admin/drivers");
  return Array.isArray(res) ? res : [];
}
export function adminRealAssignDriver(orderId: string, driverId: string) {
  return adminStaffApi.patch(`/admin/orders/${orderId}/assign-driver`, { driverId });
}
export function adminRealUpdateOrderStatus(orderId: string, status: string) {
  return adminStaffApi.patch(`/admin/orders/${orderId}/status`, { status });
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
    note: i.specialInstructions || undefined,
  }));
  const driver = o.driver
    ? {
        id: o.driver.id,
        name: o.driver.user?.name ?? "Your rider",
        phone: o.driver.user?.phone ?? "",
        avatarUrl: o.driver.user?.avatarUrl ?? undefined,
        rating: o.driver.rating ?? 4.8,
        vehicleType: o.driver.vehicleType ?? "",
        vehiclePlate: o.driver.vehiclePlate ?? "",
      }
    : null;
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
    orderType: o.orderType === "PICKUP" ? "TAKEAWAY" : o.orderType === "DINE_IN" ? "DINE_IN" : "DELIVERY",
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
    driver,
    rating: o.rating ?? undefined,
    driverRating: o.driverRating ?? undefined,
    kitchenComment: o.kitchenComment ?? "",
    driverComment: o.driverComment ?? "",
    postDeliveryTip: o.postDeliveryTip ?? 0,
    dropOff: (o.dropOffPreference ?? "MEET_DOOR") as any,
    dropNote: o.dropOffNote ?? "",
    chat: (o.messages ?? []).map((m: any) => ({ id: m.id, from: m.sender === "CUSTOMER" ? "me" : "rider", text: m.text, at: m.createdAt })),
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
