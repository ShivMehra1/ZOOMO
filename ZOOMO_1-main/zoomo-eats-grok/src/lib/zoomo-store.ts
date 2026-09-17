import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AREAS,
  COUPONS,
  DEFAULT_LOCATION,
  DELIVERY_FEE,
  TAX_RATE,
  liveStatus,
  restaurantById,
  etaMinOf,
  LATE_CREDIT,
  riderFor,
  type Dish,
  type DropOff,
} from "./zoomo-data";
import {
  ApiError,
  getRealToken,
  realAddFavorite,
  realAddToCart,
  realCancelOrder,
  realClearCart,
  realGatePing,
  realGetAddresses,
  realGetCart,
  realGetFavorites,
  realGetOrders,
  realGrantLateCredit,
  realPlaceOrder,
  realRateOrder,
  realRemoveAddress,
  realRemoveCartItem,
  realRemoveFavorite,
  realSaveAddress,
  realSendMessage,
  realSetCartItemQty,
  realSetDropOff,
  realUpdateAddress,
  realGetProfile,
  realUpdateProfile,
  realUploadAvatar,
  setRealToken,
  toStoreOrder,
  type RealCartItem,
} from "./real-api";

function toStoreCartItem(i: RealCartItem): CartItem {
  const size = i.dishSizeId ? i.dish.sizes?.find((s) => s.id === i.dishSizeId) : undefined;
  const note = i.specialInstructions || undefined;
  return {
    cartItemId: i.id,
    // A different note on the same dish is a genuinely separate line (mirrors
    // how the backend stores it) — suffix the key so both rows render distinctly.
    dishId: `${i.dishId}${i.dishSizeId ? `__${i.dishSizeId}` : ""}${note ? `__n:${note.slice(0, 24)}` : ""}`,
    restaurantId: i.dish.restaurantId,
    name: size ? `${i.dish.name} (${size.label})` : i.dish.name,
    price: size ? size.price : i.dish.price,
    imageUrl: i.dish.imageUrl,
    isVegetarian: i.dish.isVegetarian,
    quantity: i.quantity,
    note,
  };
}

export type CartItem = {
  dishId: string;
  restaurantId: string;
  name: string;
  price: number;
  imageUrl: string;
  isVegetarian: boolean;
  quantity: number;
  forPerson?: string;
  /** The real backend cart-row id, used to route setQty/removeItem to the API. */
  cartItemId?: string;
  /** Per-item note, e.g. "no onions" — a different note on the same dish is a separate line. */
  note?: string;
};

export type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

export type OrderType = "DELIVERY" | "DINE_IN" | "TAKEAWAY";
export type RideMsg = { id: string; from: "me" | "rider"; text: string; at: string };
export type Review = { id: string; restaurantId: string; name: string; rating: number; text: string; at: string };

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  status: string;
  orderType: OrderType;
  paymentMethod: string;
  promoCode: string | null;
  address?: Address | null;
  guestCount?: number | null;
  scheduledFor?: string | null;
  createdAt: string;
  promisedAt?: string;
  gatePingAt?: string | null;
  lateCredit?: number;
  statusLive?: string | null;
  statusAt?: string | null;
  driverId?: string | null;
  /** The real assigned driver's info from the backend — null until a driver is assigned. */
  driver?: {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    rating: number;
    vehicleType: string;
    vehiclePlate: string;
  } | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  dropOff?: DropOff;
  dropNote?: string;
  chat?: RideMsg[];
  rating?: number;
  proofAt?: string | null;
  noCutlery?: boolean;
  passUsed?: boolean;
  /** Populated only for real, backend-placed orders — the actually-assigned driver. */
  realDriver?: { name: string; phone: string | null; vehicleType: string; vehiclePlate: string; rating: number } | null;
};

export type StaffRole = "MERCHANT" | "DRIVER" | "ADMIN";
export type Staff = {
  role: StaffRole;
  name: string;
  email: string;
  restaurantId?: string | null;
  driverId?: string | null;
};

export type User = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  vegOnly: boolean;
  notifyOrders: boolean;
  paymentPref: string;
};

type State = {
  hydrated: boolean;
  user: User | null;
  location: string | null;
  locationPrompted: boolean;
  cart: CartItem[];
  activeBag: string | null;
  addresses: Address[];
  orders: Order[];
  favorites: string[];
  visits: Record<string, number>;
  loyalty: number;
  activatedOffers: string[];
  accountOpen: boolean;
  conflict: { dish: Dish } | null;
  staff: Staff | null;
  dishOff: string[];
  group: string[];
  reviews: Review[];
  login: (name: string, email: string, phone?: string, id?: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  toggleFavorite: (id: string) => void;
  toggleOffer: (code: string) => "on" | "off" | "full";
  setAccountOpen: (open: boolean) => void;
  setLocation: (loc: string | null) => void;
  markLocationPrompted: () => void;
  addToCart: (dish: Dish, size?: string, forPerson?: string, note?: string) => "ok" | "login";
  setItemNote: (dishId: string, note: string) => void;
  confirmReplaceCart: () => void;
  cancelReplaceCart: () => void;
  setQty: (dishId: string, delta: number) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
  clearBag: (restaurantId: string) => void;
  setActiveBag: (id: string | null) => void;
  refreshCart: () => Promise<void>;
  /** Surfaces a real backend failure to the user; self-heals a stale local session on 401. */
  handleApiError: (err: unknown, userMessage: string) => void;
  saveAddress: (a: Omit<Address, "id">) => Address;
  updateAddress: (id: string, patch: Partial<Omit<Address, "id">>) => void;
  removeAddress: (id: string) => void;
  refreshAddresses: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  cancelOrder: (id: string) => void;
  pingGate: (id: string) => void;
  grantLateCredit: (id: string) => number;
  staffLogin: (email: string, password: string) => Staff | null;
  staffLogout: () => void;
  setOrderLiveStatus: (id: string, status: string) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  toggleDishOff: (dishId: string) => void;
  setDropOff: (id: string, dropOff: DropOff, dropNote?: string) => void;
  sendRideChat: (id: string, text: string) => void;
  rateOrder: (id: string, rating: number) => void;
  setProof: (id: string) => void;
  addGuest: (name: string) => void;
  removeGuest: (name: string) => void;
  addReview: (restaurantId: string, rating: number, text: string) => void;
  reorder: (orderId: string) => "ok" | "empty";
  placeOrder: (payload: {
    orderType: OrderType;
    paymentMethod: string;
    promoCode: string | null;
    tip: number;
    addressId: string | null;
    guestCount: number | null;
    scheduledFor: string | null;
    restaurantId?: string;
    dropOff?: DropOff;
    dropNote?: string;
    noCutlery?: boolean;
  }) => Promise<Order>;
};

export function cartTotals(
  cart: CartItem[],
  promo?: string | null,
  tip = 0,
  orderType: OrderType = "DELIVERY",
  pass = false,
) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  let delivery = orderType === "DELIVERY" ? DELIVERY_FEE : 0;
  if (pass && orderType === "DELIVERY") delivery = 0;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  let discount = 0;
  if (promo && COUPONS[promo]) {
    const c = COUPONS[promo];
    if (c.type === "percent") discount = Math.min((subtotal * c.value) / 100, c.max ?? Infinity);
    else if (c.type === "flat") discount = Math.min(c.value, subtotal);
    else if (c.type === "ship") delivery = 0;
  }
  const total = Math.max(0, +(subtotal + delivery + tax + tip - discount).toFixed(2));
  return { subtotal: +subtotal.toFixed(2), deliveryFee: delivery, tax, discount: +discount.toFixed(2), tip, total };
}

export const STAFF_ACCOUNTS: { email: string; password: string; staff: Staff }[] = [
  { email: "kitchen@zoomo.eats", password: "zoomo123", staff: { role: "MERCHANT", name: "Jourian kitchen", email: "kitchen@zoomo.eats", restaurantId: null } },
  { email: "owner1@zoomoeats.com", password: "owner123", staff: { role: "MERCHANT", name: "Pizza Palace", email: "owner1@zoomoeats.com", restaurantId: "pizza-palace" } },
  { email: "ilp@zoomo.eats", password: "zoomo123", staff: { role: "MERCHANT", name: "I Love Pizza", email: "ilp@zoomo.eats", restaurantId: "i-love-pizza" } },
  { email: "driver@zoomoeats.com", password: "driver123", staff: { role: "DRIVER", name: "Mike Driver", email: "driver@zoomoeats.com", driverId: "ravi" } },
  { email: "aman@zoomo.eats", password: "zoomo123", staff: { role: "DRIVER", name: "Aman Sharma", email: "aman@zoomo.eats", driverId: "aman" } },
  { email: "admin@zoomo.eats", password: "zoomo123", staff: { role: "ADMIN", name: "Zoomo HQ", email: "admin@zoomo.eats" } },
  { email: "admin@zoomoeats.com", password: "admin123", staff: { role: "ADMIN", name: "Admin User", email: "admin@zoomoeats.com" } },
];

export const useZoomo = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      location: DEFAULT_LOCATION,
      locationPrompted: false,
      cart: [],
      activeBag: null,
      addresses: [],
      orders: [],
      favorites: [],
      visits: {},
      loyalty: 0,
      activatedOffers: [],
      accountOpen: false,
      conflict: null,
      staff: null,
      dishOff: [],
      group: [],
      reviews: [],
      login: (name, email, phone = "", id) => {
        const prev = get().user;
        const same = prev?.email.toLowerCase() === email.toLowerCase();
        set({
          user: {
            id,
            name,
            email,
            phone: phone || (same ? prev?.phone || "" : ""),
            vegOnly: same ? Boolean(prev?.vegOnly) : false,
            notifyOrders: same ? prev?.notifyOrders !== false : true,
            paymentPref: same ? prev?.paymentPref || "UPI" : "UPI",
          },
        });
        // Real login/signup already stored the JWT — pull this account's real
        // cart/addresses/orders in immediately rather than waiting on the next
        // root-loader run (which may be cached across a client-side nav).
        if (id) {
          get().refreshCart();
          get().refreshAddresses();
          get().refreshOrders();
          get().refreshFavorites();
          get().refreshProfile();
        }
      },
      logout: () => {
        setRealToken(null);
        set({ user: null, cart: [] });
      },
      updateUser: (patch) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, ...patch } });
        // Only name/phone/avatarUrl exist on the real User record — vegOnly/
        // notifyOrders/paymentPref/email stay local-only preferences.
        const { name, phone, avatarUrl } = patch;
        if (getRealToken() && (name !== undefined || phone !== undefined || avatarUrl !== undefined)) {
          realUpdateProfile({ name, phone, avatarUrl }).catch((err) =>
            get().handleApiError(err, "Could not save your profile."),
          );
        }
      },
      refreshProfile: async () => {
        if (!getRealToken()) return;
        try {
          const u = await realGetProfile();
          const prev = get().user;
          if (!prev) return;
          set({ user: { ...prev, name: u.name, phone: u.phone || "", avatarUrl: u.avatarUrl || undefined } });
        } catch (err) {
          get().handleApiError(err, "Could not load your profile.");
        }
      },
      uploadAvatar: async (file: File) => {
        try {
          const { url } = await realUploadAvatar(file);
          get().updateUser({ avatarUrl: url });
        } catch (err) {
          get().handleApiError(err, "Could not upload that photo.");
        }
      },
      setLocation: (loc) => set({ location: loc, locationPrompted: true }),
      markLocationPrompted: () => set({ locationPrompted: true }),
      toggleFavorite: (id) => {
        const fav = get().favorites ?? [];
        const nowFavorited = !fav.includes(id);
        set({ favorites: nowFavorited ? [...fav, id] : fav.filter((x) => x !== id) });
        if (!getRealToken()) return;
        const req = nowFavorited ? realAddFavorite(id) : realRemoveFavorite(id);
        req.catch((err) => get().handleApiError(err, "Could not update your favorites."));
      },
      refreshFavorites: async () => {
        if (!getRealToken()) return;
        try {
          const list = await realGetFavorites();
          set({ favorites: list.map((r) => r.id) });
        } catch (err) {
          get().handleApiError(err, "Could not load your favorites.");
        }
      },
      toggleOffer: (code) => {
        const on = get().activatedOffers ?? [];
        if (on.includes(code)) {
          set({ activatedOffers: on.filter((x) => x !== code) });
          return "off";
        }
        if (on.length >= 2) return "full";
        set({ activatedOffers: [...on, code] });
        return "on";
      },
      setAccountOpen: (open) => set({ accountOpen: open }),
      addToCart: (dish, size, _forPerson, note) => {
        if (!get().user || !getRealToken()) return "login";
        // Real cart is single-restaurant (backend clears on a restaurant switch) —
        // mirror that here instead of the reference's local multi-bag simulation.
        realAddToCart(dish.id, 1, size, note)
          .then(() => get().refreshCart())
          .catch((err) => get().handleApiError(err, "Could not add that to your bag."));
        set({ activeBag: dish.restaurantId });
        return "ok";
      },
      setItemNote: (dishId, note) => {
        const item = get().cart.find((i) => i.dishId === dishId);
        if (!item?.cartItemId) return;
        set({ cart: get().cart.map((i) => (i.dishId === dishId ? { ...i, note: note || undefined } : i)) });
        realSetCartItemQty(item.cartItemId, item.quantity, note)
          .then(() => get().refreshCart())
          .catch((err) => get().handleApiError(err, "Could not update that note."));
      },
      confirmReplaceCart: () => set({ conflict: null }),
      cancelReplaceCart: () => set({ conflict: null }),
      setQty: (dishId, delta) => {
        const item = get().cart.find((i) => i.dishId === dishId);
        if (!item?.cartItemId) return;
        const nextQty = item.quantity + delta;
        set({
          cart: nextQty <= 0
            ? get().cart.filter((i) => i.dishId !== dishId)
            : get().cart.map((i) => (i.dishId === dishId ? { ...i, quantity: nextQty } : i)),
        });
        const req = nextQty <= 0 ? realRemoveCartItem(item.cartItemId) : realSetCartItemQty(item.cartItemId, nextQty);
        req.then(() => get().refreshCart()).catch((err) => get().handleApiError(err, "Could not update that item."));
      },
      removeItem: (dishId) => {
        const item = get().cart.find((i) => i.dishId === dishId);
        set({ cart: get().cart.filter((i) => i.dishId !== dishId) });
        if (item?.cartItemId) {
          realRemoveCartItem(item.cartItemId).then(() => get().refreshCart()).catch((err) => get().handleApiError(err, "Could not remove that item."));
        }
      },
      clearCart: () => {
        set({ cart: [], activeBag: null });
        realClearCart().catch((err) => get().handleApiError(err, "Could not clear your bag."));
      },
      clearBag: (restaurantId) => {
        set({
          cart: get().cart.filter((i) => i.restaurantId !== restaurantId),
          activeBag: get().activeBag === restaurantId ? null : get().activeBag,
        });
        realClearCart().catch((err) => get().handleApiError(err, "Could not clear your bag."));
      },
      setActiveBag: (id) => set({ activeBag: id }),
      refreshCart: async () => {
        if (!getRealToken()) return;
        try {
          const items = await realGetCart();
          set({ cart: items.map(toStoreCartItem) });
        } catch (err) {
          get().handleApiError(err, "Could not load your bag.");
        }
      },
      handleApiError: (err, userMessage) => {
        console.error("[api]", err);
        if (err instanceof ApiError && err.status === 401) {
          // Stale local session (e.g. a leftover login from before this app was
          // wired to the real backend) — clear it so the next attempt re-auths.
          setRealToken(null);
          set({ user: null, cart: [], addresses: [], orders: [] });
          if (typeof window !== "undefined") {
            alert("Your session expired — please sign in again.");
            window.location.href = "/login";
          }
          return;
        }
        if (typeof window !== "undefined") {
          alert(err instanceof Error ? `${userMessage}\n\n${err.message}` : userMessage);
        }
      },
      saveAddress: (a) => {
        const tempId = crypto.randomUUID();
        const addr: Address = { ...a, id: tempId };
        set({ addresses: [...get().addresses, addr] });
        realSaveAddress(a)
          .then((real) => set({ addresses: get().addresses.map((x) => (x.id === tempId ? { ...a, id: real.id } : x)) }))
          .catch((err) => get().handleApiError(err, "Could not save that address."));
        return addr;
      },
      updateAddress: (id, patch) => {
        set({ addresses: get().addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
        realUpdateAddress(id, patch).catch((err) => get().handleApiError(err, "Could not update that address."));
      },
      removeAddress: (id) => {
        set({ addresses: get().addresses.filter((a) => a.id !== id) });
        realRemoveAddress(id).catch((err) => get().handleApiError(err, "Could not remove that address."));
      },
      refreshAddresses: async () => {
        if (!getRealToken()) return;
        try {
          const list = await realGetAddresses();
          set({ addresses: list });
        } catch (err) {
          get().handleApiError(err, "Could not load your addresses.");
        }
      },
      cancelOrder: (id) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o || o.status === "CANCELLED") return;
        const st = liveStatus(o);
        if (st === "DELIVERED" || st === "CANCELLED") return;
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, status: "CANCELLED", statusLive: "CANCELLED" } : x)),
        });
        realCancelOrder(id).then(() => get().refreshOrders()).catch((err) => get().handleApiError(err, "Could not cancel this order."));
      },
      pingGate: (id) => {
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, gatePingAt: new Date().toISOString() } : x)),
        });
        realGatePing(id).catch((err) => get().handleApiError(err, "Could not send that ping."));
      },
      grantLateCredit: (id) => {
        const o = get().orders.find((x) => x.id === id);
        if (!o || o.lateCredit) return 0;
        set({
          orders: get().orders.map((x) =>
            x.id === id ? { ...x, lateCredit: LATE_CREDIT, total: Math.max(0, x.total - LATE_CREDIT) } : x,
          ),
        });
        realGrantLateCredit(id).then(() => get().refreshOrders()).catch((err) => get().handleApiError(err, "Could not apply the late credit."));
        return LATE_CREDIT;
      },
      staffLogin: (email, password) => {
        const row = STAFF_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
        );
        if (!row) return null;
        set({ staff: row.staff });
        return row.staff;
      },
      staffLogout: () => set({ staff: null }),
      setOrderLiveStatus: (id, status) => {
        set({
          orders: get().orders.map((x) =>
            x.id === id
              ? { ...x, statusLive: status, statusAt: new Date().toISOString(), status: status === "CANCELLED" ? "CANCELLED" : x.status }
              : x,
          ),
        });
      },
      assignDriver: (orderId, driverId) => {
        set({ orders: get().orders.map((x) => (x.id === orderId ? { ...x, driverId } : x)) });
      },
      toggleDishOff: (dishId) => {
        const off = get().dishOff ?? [];
        set({ dishOff: off.includes(dishId) ? off.filter((d) => d !== dishId) : [...off, dishId] });
      },
      setDropOff: (id, dropOff, dropNote) => {
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, dropOff, dropNote: dropNote ?? x.dropNote } : x)),
        });
        realSetDropOff(id, dropOff, dropNote).catch((err) => get().handleApiError(err, "Could not update drop-off."));
      },
      sendRideChat: (id, text) => {
        const t = text.trim();
        if (!t) return;
        const mine: RideMsg = { id: `m${Date.now()}`, from: "me", text: t, at: new Date().toISOString() };
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, chat: [...(x.chat ?? []), mine] } : x)),
        });
        // No real rider-reply channel yet — the message itself is persisted.
        realSendMessage(id, t).catch((err) => get().handleApiError(err, "Message could not be sent."));
      },
      rateOrder: (id, rating) => {
        set({ orders: get().orders.map((x) => (x.id === id ? { ...x, rating } : x)) });
        realRateOrder(id, rating).catch((err) => get().handleApiError(err, "Could not save your rating."));
      },
      setProof: (id) => {
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, proofAt: new Date().toISOString() } : x)),
        });
      },
      addGuest: (name) => {
        const n = name.trim();
        if (!n) return;
        const g = get().group;
        if (g.includes(n)) return;
        set({ group: [...g, n] });
      },
      removeGuest: (name) => set({ group: get().group.filter((g) => g !== name) }),
      addReview: (restaurantId, rating, text) => {
        const user = get().user;
        if (!user) return;
        const row: Review = {
          id: `rv${Date.now()}`,
          restaurantId,
          name: user.name,
          rating,
          text: text.trim(),
          at: new Date().toISOString(),
        };
        set({ reviews: [row, ...get().reviews] });
      },
      reorder: (orderId) => {
        const o = get().orders.find((x) => x.id === orderId);
        if (!o?.items.length) return "empty";
        set({ activeBag: o.restaurantId });
        realClearCart()
          .then(() =>
            Promise.all(
              o.items.map((i) => {
                const [realDishId, sizeId] = i.dishId.split("__");
                return realAddToCart(realDishId, i.quantity, sizeId);
              }),
            ),
          )
          .then(() => get().refreshCart())
          .catch((err) => get().handleApiError(err, "Could not reorder this."));
        return "ok";
      },
      placeOrder: async (payload) => {
        await realPlaceOrder(payload);
        await get().refreshCart();
        const orders = await realGetOrders();
        const mapped = orders.map(toStoreOrder) as Order[];
        set({ orders: mapped, activeBag: null });
        const restaurantId = payload.restaurantId || get().activeBag || "";
        const visits = { ...(get().visits ?? {}) };
        visits[restaurantId] = (visits[restaurantId] || 0) + 1;
        set({ visits });
        return mapped[0];
      },
      refreshOrders: async () => {
        if (!getRealToken()) return;
        try {
          const list = await realGetOrders();
          set({ orders: list.map(toStoreOrder) as Order[] });
        } catch (err) {
          get().handleApiError(err, "Could not load your orders.");
        }
      },
    }),
    {
      name: "zoomo-eats-customer",
      partialize: (state) => ({
        user: state.user,
        location: state.location,
        locationPrompted: state.locationPrompted,
        cart: state.cart,
        addresses: state.addresses,
        orders: state.orders,
        favorites: state.favorites,
        visits: state.visits,
        activatedOffers: state.activatedOffers,
        staff: state.staff,
        dishOff: state.dishOff,
        group: state.group,
        reviews: state.reviews,
      }),
      onRehydrateStorage: () => (state) => {
        const loc = (state?.location ?? "").split(",")[0].trim();
        const known = AREAS.some((a) => a.toLowerCase() === loc.toLowerCase());
        useZoomo.setState({
          hydrated: true,
          favorites: state?.favorites ?? [],
          visits: state?.visits ?? {},
          activatedOffers: (state?.activatedOffers ?? []).slice(0, 2),
          staff: state?.staff ?? null,
          dishOff: state?.dishOff ?? [],
          group: state?.group ?? [],
          reviews: state?.reviews ?? [],
          location: known ? loc : DEFAULT_LOCATION,
        });
      },
    },
  ),
);

export function visitsOf(visits: Record<string, number> | undefined, id: string) {
  return visits?.[id] ?? 0;
}
export function isRegular(visits: Record<string, number> | undefined, id: string) {
  return visitsOf(visits, id) >= 3;
}
export function stampCount(visits: Record<string, number> | undefined, id: string) {
  return visitsOf(visits, id) % 5;
}
export function qtyOf(dishId: string, cart: CartItem[]) {
  return cart.filter((i) => i.dishId === dishId || i.dishId.startsWith(`${dishId}__`)).reduce((s, i) => s + i.quantity, 0);
}
export { dishesFor, restaurantById } from "./zoomo-data";
