import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AREAS,
  COUPONS,
  DEFAULT_LOCATION,
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
  realAddReview,
  realAddToCart,
  realCancelOrder,
  realClearCart,
  realClearRestaurantCart,
  realGatePing,
  realGetAddresses,
  realGetCart,
  realGetFavorites,
  realGetOrder,
  realGetOrders,
  realGrantLateCredit,
  realPlaceOrder,
  realRateDriver,
  realRateOrder,
  realExtraTip,
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

let cartChain: Promise<void> = Promise.resolve();

function enqueueCart(work: () => Promise<void>) {
  cartChain = cartChain.then(work, work);
  return cartChain;
}

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
  lat?: number | null;
  lng?: number | null;
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
  driverRating?: number;
  kitchenComment?: string;
  driverComment?: string;
  postDeliveryTip?: number;
  proofAt?: string | null;
  noCutlery?: boolean;
  passUsed?: boolean;
  /** Populated only for real, backend-placed orders — the actually-assigned driver. */
  realDriver?: { name: string; phone: string | null; vehicleType: string; vehiclePlate: string; rating: number } | null;
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
  conflict: { dish: Dish; size?: string; note?: string } | null;
  dishOff: string[];
  reviews: Review[];
  lastError: string | null;
  toast: string | null;
  showToast: (msg: string) => void;
  login: (name: string, email: string, phone?: string, id?: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  toggleFavorite: (id: string) => void;
  toggleOffer: (code: string) => "on" | "off" | "full";
  setAccountOpen: (open: boolean) => void;
  setLocation: (loc: string | null) => void;
  markLocationPrompted: () => void;
  addToCart: (dish: Dish, size?: string, note?: string) => "ok" | "login";
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
  saveAddress: (a: Omit<Address, "id">) => Promise<Address>;
  captureLiveLocation: () => Promise<Address | null>;
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
  setDropOff: (id: string, dropOff: DropOff, dropNote?: string) => void;
  sendRideChat: (id: string, text: string) => void;
  rateOrder: (id: string, rating: number, comment?: string) => Promise<void>;
  rateDriver: (id: string, rating: number, comment?: string) => Promise<void>;
  extraTip: (id: string, amount: number) => Promise<void>;
  setProof: (id: string) => void;
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
  km = 2,
) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  let delivery = 0;
  if (orderType === "DELIVERY" && !pass) {
    delivery = Math.min(50, Math.max(15, Math.round(subtotal * 0.06 + km * 6)));
  }
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
      dishOff: [],
      reviews: [],
      lastError: null,
      toast: null,
      showToast: (msg) => {
        set({ toast: msg });
        setTimeout(() => {
          if (get().toast === msg) set({ toast: null });
        }, 2400);
      },
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
          get().refreshAddresses().then(() => get().captureLiveLocation());
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
        const name = restaurantById(id)?.name || "Restaurant";
        get().showToast(nowFavorited ? `${name} added to favourites` : `${name} removed from favourites`);
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
          set({ activatedOffers: [] });
          return "off";
        }
        set({ activatedOffers: [code] });
        return "on";
      },
      setAccountOpen: (open) => set({ accountOpen: open }),
      addToCart: (dish, size, note) => {
        if (!get().user || !getRealToken()) return "login";
        enqueueCart(async () => {
          try {
            const items = await realAddToCart(dish.id, 1, size, note);
            set({
              cart: items.map(toStoreCartItem),
              activeBag: dish.restaurantId,
              conflict: null,
            });
          } catch (err) {
            get().handleApiError(err, "Could not add that to your bag.");
          }
        });
        return "ok";
      },
      setItemNote: (dishId, note) => {
        const item = get().cart.find((i) => i.dishId === dishId);
        if (!item?.cartItemId) return;
        set({ cart: get().cart.map((i) => (i.dishId === dishId ? { ...i, note: note || undefined } : i)) });
        realSetCartItemQty(item.cartItemId, item.quantity, note)
          .then((items) => set({ cart: items.map(toStoreCartItem) }))
          .catch((err) => get().handleApiError(err, "Could not update that note."));
      },
      confirmReplaceCart: () => {
        const pending = get().conflict;
        if (!pending) return;
        set({ conflict: null });
        get().addToCart(pending.dish, pending.size, pending.note);
      },
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
        req.then((items) => set({ cart: items.map(toStoreCartItem) })).catch((err) => get().handleApiError(err, "Could not update that item."));
      },
      removeItem: (dishId) => {
        const item = get().cart.find((i) => i.dishId === dishId);
        set({ cart: get().cart.filter((i) => i.dishId !== dishId) });
        if (item?.cartItemId) {
          realRemoveCartItem(item.cartItemId).then((items) => set({ cart: items.map(toStoreCartItem) })).catch((err) => get().handleApiError(err, "Could not remove that item."));
        }
      },
      clearCart: () => {
        set({ cart: [], activeBag: null });
        realClearCart()
          .then((items) => set({ cart: items.map(toStoreCartItem), activeBag: null }))
          .catch((err) => get().handleApiError(err, "Could not clear your bag."));
      },
      clearBag: (restaurantId) => {
        set({
          cart: get().cart.filter((i) => i.restaurantId !== restaurantId),
          activeBag: get().activeBag === restaurantId ? null : get().activeBag,
        });
        realClearRestaurantCart(restaurantId)
          .then((items) => set({
            cart: items.map(toStoreCartItem),
            activeBag: get().activeBag === restaurantId ? null : get().activeBag,
          }))
          .catch((err) => get().handleApiError(err, "Could not clear that bag."));
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
          setRealToken(null);
          set({ user: null, cart: [], addresses: [], orders: [] });
          return;
        }
        set({ lastError: err instanceof Error ? `${userMessage}: ${err.message}` : userMessage });
      },
      saveAddress: async (a) => {
        try {
          const real = await realSaveAddress(a);
          const addr: Address = {
            id: real.id,
            street: real.street || a.street,
            city: real.city || a.city,
            state: real.state || a.state,
            zipCode: real.zipCode || a.zipCode,
            lat: real.lat ?? a.lat ?? null,
            lng: real.lng ?? a.lng ?? null,
          };
          const rest = get().addresses.filter((x) => x.id !== addr.id);
          set({ addresses: [addr, ...rest] });
          return addr;
        } catch (err) {
          get().handleApiError(err, "Could not save that address.");
          throw err;
        }
      },
      captureLiveLocation: async () => {
        if (typeof window === "undefined") return null;
        if ((globalThis as any).__zoomoGeoLock) return null;
        (globalThis as any).__zoomoGeoLock = true;
        try {
          const { captureLivePlace } = await import("./live-location");
          const place = await captureLivePlace();
          if (!place) return null;
          set({ location: place.label || place.city, locationPrompted: true });
          const existing = get().addresses.find(
            (a) => a.street === place.street || (a.lat && Math.abs((a.lat || 0) - place.lat) < 0.0008),
          );
          if (existing) {
            get().updateAddress(existing.id, {
              street: place.street,
              city: place.city,
              state: place.state,
              zipCode: place.zipCode,
              lat: place.lat,
              lng: place.lng,
            });
            return { ...existing, ...place, id: existing.id };
          }
          return await get().saveAddress({
            street: place.street,
            city: place.city,
            state: place.state,
            zipCode: place.zipCode,
            lat: place.lat,
            lng: place.lng,
          });
        } catch {
          return null;
        } finally {
          (globalThis as any).__zoomoGeoLock = false;
        }
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
      rateOrder: async (id, rating, comment) => {
        set({ orders: get().orders.map((x) => (x.id === id ? { ...x, rating, kitchenComment: comment ?? x.kitchenComment } : x)) });
        try {
          const raw = await realRateOrder(id, rating, comment);
          if (raw?.id) {
            const mapped = toStoreOrder(raw) as Order;
            const user = get().user;
            set({
              orders: get().orders.map((x) => (x.id === id ? mapped : x)),
              reviews: user
                ? [
                    {
                      id: `rv-${id}`,
                      restaurantId: mapped.restaurantId,
                      name: user.name,
                      rating,
                      text: comment?.trim() || "",
                      at: new Date().toISOString(),
                    },
                    ...get().reviews.filter((r) => r.id !== `rv-${id}`),
                  ]
                : get().reviews,
            });
          }
        } catch (err) {
          get().handleApiError(err, "Could not save your kitchen review.");
          throw err;
        }
      },
      rateDriver: async (id, rating, comment) => {
        set({ orders: get().orders.map((x) => (x.id === id ? { ...x, driverRating: rating, driverComment: comment ?? x.driverComment } : x)) });
        try {
          const raw = await realRateDriver(id, rating, comment);
          if (raw?.id) {
            const mapped = toStoreOrder(raw) as Order;
            set({ orders: get().orders.map((x) => (x.id === id ? mapped : x)) });
          }
        } catch (err) {
          get().handleApiError(err, "Could not save your driver rating.");
          throw err;
        }
      },
      extraTip: async (id, amount) => {
        try {
          const raw = await realExtraTip(id, amount);
          if (raw?.id) {
            const mapped = toStoreOrder(raw) as Order;
            set({ orders: get().orders.map((x) => (x.id === id ? mapped : x)) });
          }
        } catch (err) {
          get().handleApiError(err, "Could not add that tip.");
          throw err;
        }
      },
      setProof: (id) => {
        set({
          orders: get().orders.map((x) => (x.id === id ? { ...x, proofAt: new Date().toISOString() } : x)),
        });
      },
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
        realAddReview(restaurantId, rating, text.trim()).catch((err) =>
          get().handleApiError(err, "Could not post your review."),
        );
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
        await cartChain;
        const rid = payload.restaurantId;
        const forKitchen = (items: RealCartItem[]) =>
          rid ? items.filter((i) => i.dish?.restaurantId === rid) : items;
        let serverItems = await realGetCart().catch(() => [] as RealCartItem[]);
        if (!forKitchen(serverItems).length) {
          const local = get().cart.filter((i) => !rid || i.restaurantId === rid);
          for (const line of local) {
            const [dishId, sizePart] = line.dishId.split("__");
            const sizeId = sizePart && !sizePart.startsWith("n:") ? sizePart : undefined;
            await realAddToCart(dishId, line.quantity, sizeId);
          }
          serverItems = await realGetCart();
        }
        if (!forKitchen(serverItems).length) throw new Error("Your bag is empty.");
        const created = await realPlaceOrder({ ...payload, promoCode: payload.promoCode || null });
        if (!created?.id) throw new Error("Order did not return an id.");
        let mapped: Order;
        try {
          const full = await realGetOrder(created.id);
          mapped = toStoreOrder(full?.id ? full : created) as Order;
        } catch {
          mapped = toStoreOrder(created) as Order;
        }
        await get().refreshCart();
        const restaurantId = payload.restaurantId || mapped.restaurantId || "";
        const visits = { ...(get().visits ?? {}) };
        visits[restaurantId] = (visits[restaurantId] || 0) + 1;
        set({
          orders: [mapped, ...get().orders.filter((o) => o.id !== mapped.id)],
          activeBag: null,
          visits,
        });
        return mapped;
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
        favorites: state.favorites,
        visits: state.visits,
        activatedOffers: state.activatedOffers,
        activeBag: state.activeBag,
      }),
      onRehydrateStorage: () => (state) => {
        const loc = (state?.location ?? "").split(",")[0].trim();
        const known = AREAS.some((a) => a.toLowerCase() === loc.toLowerCase());
        useZoomo.setState({
          hydrated: true,
          // Bag/addresses/orders always come from the API — never from a
          // leftover local snapshot (old slug dish ids made Add look broken).
          cart: [],
          addresses: [],
          orders: [],
          favorites: state?.favorites ?? [],
          visits: state?.visits ?? {},
          activatedOffers: (state?.activatedOffers ?? []).slice(0, 2),
          dishOff: [],
          reviews: [],
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
