import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Leaf, MapPin, Tag, Trash2, Utensils, X } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { QtyStepper } from "@/components/zoomo/qty";
import { COUPONS, DROP_OFF, IMG, OFFERS, TIP_PRESETS, etaMinOf, gateBy, inr, restaurantById } from "@/lib/zoomo-data";
import { cartTotals, useZoomo, type OrderType } from "@/lib/zoomo-store";
import { GreenSwitch } from "@/components/zoomo/switch";
import { realQuoteOrder, type OrderQuote } from "@/lib/real-api";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const nav = useNavigate();
  const { cart, user, addresses, saveAddress, removeAddress, placeOrder, activeBag, setQty, hydrated, captureLiveLocation, activatedOffers } = useZoomo();
  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [pay, setPay] = useState("COD");
  const [addrId, setAddrId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [form, setForm] = useState({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [promoInput, setPromoInput] = useState(activatedOffers?.[0] ?? "");
  const [promo, setPromo] = useState<string | null>(activatedOffers?.[0] ?? null);
  const [promoErr, setPromoErr] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const placing = useRef(false);
  const [dropOff, setDropOff] = useState<(typeof DROP_OFF)[number]["id"]>("MEET_DOOR");
  const [dropNote, setDropNote] = useState("");
  const [noCutlery, setNoCutlery] = useState(false);
  const [liveAddrId, setLiveAddrId] = useState<string | null>(null);
  const [liveLabel, setLiveLabel] = useState("");

  const kitchenId =
    activeBag && cart.some((i) => i.restaurantId === activeBag) ? activeBag : cart[0]?.restaurantId;
  const bag = cart.filter((i) => i.restaurantId === kitchenId);
  const localTotals = useMemo(
    () => cartTotals(bag, promo, customTip ? Number(customVal) || 0 : tip, orderType, false),
    [bag, promo, tip, customTip, customVal, orderType],
  );
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  // The delivery fee is distance-dependent (real km to the address), so the
  // client can't compute an accurate preview itself — ask the backend for
  // the same numbers it'll actually charge when the order is placed.
  useEffect(() => {
    if (!user || bag.length === 0) return;
    if (orderType === "DELIVERY" && !addrId) {
      setQuote(null);
      setQuoteError("");
      return;
    }
    let cancelled = false;
    setQuoteError("");
    realQuoteOrder({
      orderType,
      addressId: orderType === "DELIVERY" ? addrId : null,
      promoCode: promo,
      tip: customTip ? Number(customVal) || 0 : tip,
      restaurantId: kitchenId,
    })
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        setQuoteError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(err?.message || "");
      });
    return () => {
      cancelled = true;
    };
  }, [user, bag.length, orderType, addrId, promo, tip, customTip, customVal]);

  const t = quote ?? localTotals;

  const MIN_DELIVERY_SUBTOTAL = 50;
  const bagSubtotal = bag.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryLocked = bagSubtotal < MIN_DELIVERY_SUBTOTAL;

  // Cart total can drop below the delivery minimum right here on checkout
  // (removing an item with the stepper) — bounce off Delivery immediately
  // instead of leaving it selected with no way to actually submit.


  useEffect(() => {
    if (!hydrated) return;
    if (!user) nav({ to: "/login" });
    else if (bag.length === 0 && !placing.current) nav({ to: "/cart" });
  }, [hydrated, user, bag.length, nav]);

  useEffect(() => {
    if (!addresses.length) {
      setAdding(true);
      return;
    }
    setAdding(false);
    if (!addrId || !addresses.some((a) => a.id === addrId)) {
      setAddrId(addresses[0].id);
    }
  }, [addresses, addrId]);

  useEffect(() => {
    if (!date) {
      const n = new Date();
      const pad = (x: number) => String(x).padStart(2, "0");
      setDate(`${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`);
      setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}`);
    }
  }, [date]);

  if (!hydrated) {
    return (
      <AppShell chat={false}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }
  if (!user || bag.length === 0) {
    return (
      <AppShell chat={false}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (!COUPONS[code]) {
      setPromoErr("Invalid code");
      setPromo(null);
      return;
    }
    setPromo(code);
    setPromoErr("");
  }

  async function submit() {
    setSubmitError("");
    if (orderType === "DELIVERY" && !addrId && !adding) return setSubmitError("Select an address to deliver to");
    if (orderType === "DELIVERY" && adding) {
      if (!form.street || !form.city || !form.state || !form.zipCode)
        return setSubmitError("Fill in the full address");
    }
    if (orderType === "DINE_IN" && (!date || !time)) {
      return setSubmitError("Pick a date and time for dine-in");
    }
    if (orderType === "DELIVERY" && schedule && (!date || !time)) {
      return setSubmitError("Pick a date and time for your delivery");
    }
    setBusy(true);
    placing.current = true;
    try {
      let id = addrId;
      if (orderType === "DELIVERY" && adding) {
        const saved = await saveAddress(form);
        id = saved.id;
        setAddrId(saved.id);
        setAdding(false);
      }
      if (orderType === "DELIVERY" && !id) {
        setBusy(false);
        placing.current = false;
        return setSubmitError("Select an address to deliver to");
      }
      const scheduledFor =
        orderType === "DELIVERY" && schedule && date && time
          ? `${date}T${time}:00`
          : orderType === "DINE_IN" && date && time
            ? `${date}T${time}:00`
            : null;
      const order = await placeOrder({
        orderType,
        paymentMethod: orderType === "DELIVERY" ? pay : "PAY_AT_RESTAURANT",
        promoCode: quoteError ? null : promo,
        tip: customTip ? Number(customVal) || 0 : tip,
        addressId: orderType === "DELIVERY" ? id : null,
        guestCount: orderType === "DINE_IN" ? guests : null,
        scheduledFor,
        restaurantId: kitchenId,
        dropOff,
        dropNote,
        noCutlery,
      });
      setPlacedOrderId(order.id);
      nav({ to: "/orders/$id", params: { id: order.id }, replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not place order — try again.");
      placing.current = false;
      setBusy(false);
    }
  }

  const cta =
    orderType === "DINE_IN"
      ? `Book Dine-In · ${inr(t.total)}`
      : orderType === "TAKEAWAY"
        ? `Confirm Takeaway · ${inr(t.total)}`
        : schedule && date && time
          ? `Schedule Delivery · ${inr(t.total)}`
          : `Place Order · ${inr(t.total)}`;

  return (
    <AppShell chat={false}>
      <div className="mx-auto max-w-[640px] px-5 py-6 pb-28">
        <BackBar title="Checkout" to="/cart" />

        <Section title="Your items">
          {bag.map((i) => (
            <div key={i.dishId} className="mb-3 flex items-center gap-3 last:mb-0">
              <FoodImg src={i.imageUrl || IMG.dishFallback} alt="" className="size-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{i.name}</p>
                <p className="text-xs text-muted tabular">{inr(i.price)} each</p>
              </div>
              <QtyStepper
                value={i.quantity}
                onLess={() => setQty(i.dishId, -1)}
                onMore={() => setQty(i.dishId, 1)}
              />
              <span className="w-14 text-right text-[13px] font-bold text-ink tabular">
                {inr(i.price * i.quantity)}
              </span>
            </div>
          ))}
        </Section>

        <Section title="How would you like this order?">
          {(
            [
              { id: "DELIVERY" as const, label: "Delivery", sub: "Delivered to your door" },
              { id: "DINE_IN" as const, label: "Dine in", sub: "Eat at the restaurant" },
              { id: "TAKEAWAY" as const, label: "Takeaway", sub: "Pick up yourself" },
            ]
          ).map((o) => {
            const locked = o.id === "DELIVERY" && deliveryLocked;
            return (
              <label
                key={o.id}
                className={`mb-2 flex items-center gap-2.5 rounded-[14px] border-[1.5px] p-3.5 ${
                  locked
                    ? "cursor-not-allowed border-line bg-page opacity-50"
                    : "cursor-pointer " + (orderType === o.id ? "border-primary bg-sage" : "border-line bg-page")
                }`}
              >
                <input
                  type="radio"
                  name="otype"
                  checked={orderType === o.id}
                  disabled={locked}
                  onChange={() => {
                    setOrderType(o.id);
                    setPay(o.id === "DELIVERY" ? "COD" : "PAY_AT_RESTAURANT");
                  }}
                  className="accent-primary"
                />
                <div>
                  <p className="text-[13px] font-semibold text-ink">{o.label}</p>
                  <p className="text-[11px] text-muted">
                    {locked ? `Add ${inr(MIN_DELIVERY_SUBTOTAL - bagSubtotal)} more to unlock delivery` : o.sub}
                  </p>
                </div>
              </label>
            );
          })}
        </Section>

        {orderType === "DINE_IN" && (
          <Section title="When would you like to dine in?">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm"
              />
            </div>
            {orderType === "DINE_IN" && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-sub">Guests</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGuests(g)}
                      className={`size-10 rounded-xl border-[1.5px] text-sm font-semibold ${
                        guests === g ? "border-primary bg-sage text-primary" : "border-line bg-page text-sub"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {guests} {guests === 1 ? "guest" : "guests"}
                </p>
              </div>
            )}
          </Section>
        )}

        {orderType === "DELIVERY" && (
          <>
            <Section title="Delivery Address">
              <p className="mb-2 text-[12px] text-sub">Pick where you are now, or another saved drop-off.</p>
              <button
                type="button"
                disabled={geoBusy}
                onClick={async () => {
                  setAdding(false);
                  if (liveAddrId) {
                    setAddrId(liveAddrId);
                    return;
                  }
                  setGeoBusy(true);
                  try {
                    const a = await captureLiveLocation();
                    if (a?.id) {
                      setLiveAddrId(a.id);
                      setLiveLabel(`${a.street}, ${a.city}`);
                      setAddrId(a.id);
                    } else {
                      setSubmitError("Could not read your location. Allow location access and try again.");
                    }
                  } finally {
                    setGeoBusy(false);
                  }
                }}
                className={`mb-3 flex w-full items-start gap-3 rounded-[14px] border-[1.5px] px-3.5 py-3 text-left ${
                  liveAddrId && addrId === liveAddrId && !adding ? "border-primary bg-sage" : "border-line bg-page"
                }`}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="block text-[13px] font-bold text-ink">
                    {geoBusy ? "Finding you…" : "Current location"}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-sub">
                    {liveLabel || "We'll pin where you are right now"}
                  </span>
                </span>
              </button>
              {addresses.filter((a) => a.id !== liveAddrId).length > 0 && (
                <p className="mb-2 text-[11px] font-bold tracking-wide text-muted uppercase">Other addresses</p>
              )}
              {addresses.filter((a) => a.id !== liveAddrId).map((a) => (
                <div
                  key={a.id}
                  className={`mb-2 flex items-start gap-2.5 rounded-[14px] border-[1.5px] p-3.5 ${
                    addrId === a.id && !adding ? "border-primary bg-sage" : "border-line bg-page"
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                    <input
                      type="radio"
                      checked={addrId === a.id && !adding}
                      onChange={() => {
                        setAddrId(a.id);
                        setAdding(false);
                      }}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-[13px] text-ink">
                      {a.street}, {a.city}, {a.state} {a.zipCode}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label="Delete address"
                    onClick={() => {
                      removeAddress(a.id);
                      if (addrId === a.id) setAddrId(addresses.find((x) => x.id !== a.id)?.id ?? null);
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {adding ? (
                <div className="space-y-2">
                  {(["street", "city", "state", "zipCode"] as const).map((k) => (
                    <input
                      key={k}
                      value={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      placeholder={k === "zipCode" ? "PIN / ZIP" : k[0].toUpperCase() + k.slice(1)}
                      className="h-11 w-full rounded-xl border-[1.5px] border-line bg-page px-3 text-sm"
                    />
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!form.street || !form.city || !form.state || !form.zipCode)
                          return alert("Please fill in the full address");
                        const a = await saveAddress(form);
                        setAddrId(a.id);
                        setAdding(false);
                      }}
                      className="rounded-xl bg-primary px-4 py-2 text-[13px] font-bold text-white"
                    >
                      Save Address
                    </button>
                    {addresses.length > 0 && (
                      <button onClick={() => setAdding(false)} className="text-[13px] text-sub">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="text-[13px] font-semibold text-primary"
                >
                  + Add new address
                </button>
              )}
            </Section>

            <Section title="Drop-off">
              <div className="grid gap-2">
                {DROP_OFF.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDropOff(d.id)}
                    className={`rounded-[14px] border-[1.5px] px-3.5 py-3 text-left ${
                      dropOff === d.id ? "border-primary bg-sage" : "border-line bg-page"
                    }`}
                  >
                    <p className="text-[13px] font-bold text-ink">{d.label}</p>
                    <p className="text-[12px] text-sub">{d.hint}</p>
                  </button>
                ))}
                <input
                  value={dropNote}
                  onChange={(e) => setDropNote(e.target.value)}
                  placeholder="Gate code, floor, dog in yard…"
                  className="mt-1 h-11 w-full rounded-xl border-[1.5px] border-line bg-page px-3 text-sm"
                />
              </div>
            </Section>

            <Section
              title={
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-accent" /> Schedule order
                  </span>
                  <GreenSwitch on={schedule} onToggle={() => setSchedule((s) => !s)} label="Schedule order" />
                </span>
              }
            >
              {schedule && (
                <>
                  <p className="mb-2 text-xs text-sub">Pick a date and time for your delivery</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm" />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm" />
                  </div>
                </>
              )}
            </Section>

            <Section title="Add a tip">
              <div className="flex flex-wrap gap-2">
                {TIP_PRESETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTip(s);
                      setCustomTip(false);
                    }}
                    className={`rounded-xl border-[1.5px] px-4 py-2 text-[13px] font-semibold ${
                      tip === s && !customTip
                        ? "border-primary bg-sage text-primary"
                        : "border-line bg-page text-sub"
                    }`}
                  >
                    {s === 0 ? "No tip" : `₹${s}`}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCustomTip(true);
                    setTip(0);
                  }}
                  className={`rounded-xl border-[1.5px] px-4 py-2 text-[13px] font-semibold ${
                    customTip ? "border-primary bg-sage text-primary" : "border-line bg-page text-sub"
                  }`}
                >
                  Custom
                </button>
              </div>
              {customTip && (
                <div className="relative mt-3">
                  <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[13px] text-muted">₹</span>
                  <input
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="Amount"
                    className="h-11 w-full rounded-xl border-[1.5px] border-line bg-page pr-3 pl-8 text-sm focus:border-primary"
                  />
                </div>
              )}
            </Section>
          </>
        )}

        <Section
          title={
            <span className="flex items-center gap-2">
              <Tag className="size-4 text-accent" /> Available offers
            </span>
          }
        >
          {promo ? (
            <div className="flex items-center justify-between rounded-[14px] border border-accent/40 bg-sage px-3.5 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-primary">
                <Check className="size-4 text-accent" /> {promo} applied
              </span>
              <button
                type="button"
                onClick={() => {
                  setPromo(null);
                  setPromoInput("");
                }}
              >
                <X className="size-4 text-sub" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {OFFERS.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => {
                    setPromo(o.code);
                    setPromoInput(o.code);
                    setPromoErr("");
                  }}
                  className="flex w-full items-center gap-3 rounded-[14px] border-[1.5px] border-line bg-page p-3 text-left hover:border-primary"
                >
                  <img src={o.image || IMG.offerZoomo50} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-ink">{o.title}</span>
                    <span className="block text-[11px] text-sub">{o.subtitle}</span>
                  </span>
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">Apply</span>
                </button>
              ))}
            </div>
          )}
          {promoErr && (
            <p className="mt-2 flex items-center gap-1 text-xs text-danger">
              <X className="size-3" /> {promoErr}
            </p>
          )}
        </Section>

        <Section
          title={
            <span className="flex items-center gap-2">
              <Utensils className="size-4 text-accent" /> Cutlery
            </span>
          }
        >
          <div className="flex items-center justify-between gap-3 rounded-[14px] border-[1.5px] border-line bg-page px-3.5 py-3">
            <span>
              <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <Leaf className="size-3.5 text-accent" /> Need cutlery?
              </span>
              <span className="mt-0.5 block text-[11px] text-sub">Forks, spoons and napkins in the bag</span>
            </span>
            <GreenSwitch on={!noCutlery} onToggle={() => setNoCutlery((s) => !s)} label="Need cutlery" />
          </div>
        </Section>

        <Section title="Payment Method">
          {(orderType === "DINE_IN" || orderType === "TAKEAWAY"
            ? [
                { id: "PAY_AT_RESTAURANT", label: "Pay at restaurant", sub: "Pay in cash or card when you arrive", disabled: false },
                { id: "ONLINE", label: "Online payment", sub: "Coming soon", disabled: true },
              ]
            : [
                { id: "COD", label: "Cash on delivery", sub: "Pay when your order arrives", disabled: false },
                { id: "ONLINE", label: "Online payment", sub: "Coming soon", disabled: true },
              ]
          ).map((S) => (
            <label
              key={S.id}
              className={`mb-2 flex items-center gap-2.5 rounded-[14px] border-[1.5px] p-3.5 ${
                S.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
              } ${pay === S.id ? "border-primary bg-sage" : "border-line bg-page"}`}
            >
              <input
                type="radio"
                name="payment"
                disabled={S.disabled}
                checked={pay === S.id}
                onChange={() => !S.disabled && setPay(S.id)}
                className="accent-primary"
              />
              <div>
                <p className="text-[13px] font-semibold text-ink">{S.label}</p>
                <p className="text-[11px] text-muted">{S.sub}</p>
              </div>
            </label>
          ))}
        </Section>

        <Section title="Bill">
          <div className="flex justify-between text-[14px] font-semibold text-ink">
            <span>Your cart</span>
            <span className="tabular">{inr(t.subtotal)}</span>
          </div>
          {orderType === "DELIVERY" && (
            <div className="mt-2 flex justify-between text-[13px] text-sub">
              <span>
                Delivery fee
                {quote?.distanceKm != null ? ` · ${quote.distanceKm} km` : addrId ? "" : " · pick an address"}
              </span>
              <span className="tabular">{orderType === "DELIVERY" && !addrId && !quote ? "—" : t.deliveryFee === 0 ? "FREE" : inr(t.deliveryFee)}</span>
            </div>
          )}
          {orderType !== "DELIVERY" && (
            <div className="mt-2 flex justify-between text-[13px] text-sub">
              <span>Delivery</span>
              <span>No fee</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-[13px] text-sub">
            <span>GST (5% on food)</span>
            <span className="tabular">{inr(t.tax)}</span>
          </div>
          {t.discount > 0 && (
            <div className="mt-2 flex justify-between text-[13px] text-veg">
              <span>Promo {promo}</span>
              <span>−{inr(t.discount)}</span>
            </div>
          )}
          {t.tip > 0 && (
            <div className="mt-2 flex justify-between text-[13px] text-primary">
              <span>Tip</span>
              <span>{inr(t.tip)}</span>
            </div>
          )}
          <div className="mt-3 flex justify-between border-t border-line-soft pt-3 text-[16px] font-bold text-ink">
            <span>To pay</span>
            <span className="tabular">{inr(t.total)}</span>
          </div>
          {orderType === "DELIVERY" && addrId && (
            <p className="mt-3 rounded-2xl bg-sage px-3 py-2 text-[12px] leading-5 text-primary">
              At your gate by <b>{gateBy(etaMinOf(restaurantById(kitchenId)))}</b>
              {quote?.distanceKm != null ? ` · ${quote.distanceKm} km` : ""}.
            </p>
          )}
          {deliveryLocked && orderType === "DELIVERY" && (
            <p className="mt-3 rounded-2xl bg-danger/10 px-3 py-2 text-[12px] text-danger">
              Delivery needs ₹{MIN_DELIVERY_SUBTOTAL}+ in the cart. Add {inr(MIN_DELIVERY_SUBTOTAL - bagSubtotal)} more, or choose pickup.
            </p>
          )}
          {quoteError && (
            <p className="mt-3 rounded-2xl bg-danger/10 px-3 py-2 text-[12px] leading-5 text-danger">{quoteError}</p>
          )}
        </Section>
        {submitError && (
          <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{submitError}</p>
        )}
      </div>

      <div className="fixed inset-x-3 bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] z-30 md:bottom-4">
        <div className="mx-auto flex max-w-[640px] items-center gap-3 rounded-[22px] bg-primary p-2 pl-5 text-white shadow-lift">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/65">Cart {inr(t.subtotal)}{orderType === "DELIVERY" ? ` + fee ${t.deliveryFee ? inr(t.deliveryFee) : "—"}` : ""} + tax {inr(t.tax)}</p>
            <p className="text-[15px] font-bold tabular">{inr(t.total)}</p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={busy || (orderType === "DELIVERY" && deliveryLocked)}
            className="rounded-xl bg-white px-5 py-3 text-[13px] font-bold text-primary disabled:opacity-60"
          >
            {busy ? "Placing…" : cta}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
      <div className="mb-3.5 text-[15px] font-bold tracking-[-0.02em] text-ink">{title}</div>
      {children}
    </div>
  );
}
