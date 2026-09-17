import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Leaf, MapPin, Tag, X } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { QtyStepper } from "@/components/zoomo/qty";
import { COUPONS, DROP_OFF, IMG, SHOP_KEEP_PCT, TIP_PRESETS, etaMinOf, gateBy, inr, restaurantById } from "@/lib/zoomo-data";
import { cartTotals, useZoomo, type OrderType } from "@/lib/zoomo-store";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const nav = useNavigate();
  const { cart, user, addresses, saveAddress, placeOrder, activatedOffers, activeBag, setQty, hydrated } = useZoomo();
  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [pay, setPay] = useState("COD");
  const [addrId, setAddrId] = useState(addresses[0]?.id ?? null);
  const [adding, setAdding] = useState(addresses.length === 0);
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
  const placing = useRef(false);
  const [dropOff, setDropOff] = useState<(typeof DROP_OFF)[number]["id"]>("MEET_DOOR");
  const [dropNote, setDropNote] = useState("");
  const [noCutlery, setNoCutlery] = useState(false);

  const bag = cart.filter((i) => i.restaurantId === (activeBag || cart[0]?.restaurantId));
  const t = useMemo(
    () => cartTotals(bag, promo, customTip ? Number(customVal) || 0 : tip, orderType, false),
    [bag, promo, tip, customTip, customVal, orderType],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!user) nav({ to: "/login" });
    else if (bag.length === 0 && !placing.current) nav({ to: "/cart" });
  }, [hydrated, user, bag.length, nav]);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }
  if (!user || bag.length === 0) return null;

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
    if (orderType === "DELIVERY" && !addrId && !adding) return alert("Please select an address");
    if (orderType === "DELIVERY" && adding) {
      if (!form.street || !form.city || !form.state || !form.zipCode)
        return alert("Please fill in the full address");
    }
    if ((orderType === "DINE_IN" || orderType === "TAKEAWAY") && (!date || !time)) {
      return alert(`Select a date and time for your ${orderType === "DINE_IN" ? "dine-in" : "takeaway"}`);
    }
    if (orderType === "DELIVERY" && schedule && (!date || !time)) {
      return alert("Select a date and time for your delivery");
    }
    setBusy(true);
    placing.current = true;
    try {
      let id = addrId;
      if (orderType === "DELIVERY" && adding) {
        id = saveAddress(form).id;
      }
      const scheduledFor =
        orderType === "DELIVERY" && schedule && date && time
          ? `${date}T${time}:00`
          : orderType !== "DELIVERY" && date && time
            ? `${date}T${time}:00`
            : null;
      const order = await placeOrder({
        orderType,
        paymentMethod: orderType === "DELIVERY" ? pay : "PAY_AT_RESTAURANT",
        promoCode: promo,
        tip: customTip ? Number(customVal) || 0 : tip,
        addressId: orderType === "DELIVERY" ? id : null,
        guestCount: orderType === "DINE_IN" ? guests : null,
        scheduledFor,
        restaurantId: activeBag || bag[0]?.restaurantId,
        dropOff,
        dropNote,
        noCutlery,
      });
      nav({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not place order.");
      placing.current = false;
    } finally {
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
    <AppShell>
      <div className="mx-auto max-w-[640px] px-5 py-6 pb-28">
        <BackBar title="Checkout" to="/cart" />

        <Section title="Your items">
          {bag.map((i) => (
            <div key={i.dishId} className="mb-3 flex items-center gap-3 last:mb-0">
              <FoodImg src={i.imageUrl || IMG.dishFallback} alt="" className="size-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{i.name}</p>
                {i.forPerson && <p className="text-[11px] text-primary">For {i.forPerson}</p>}
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
          ).map((o) => (
            <label
              key={o.id}
              className={`mb-2 flex cursor-pointer items-center gap-2.5 rounded-[14px] border-[1.5px] p-3.5 ${
                orderType === o.id ? "border-primary bg-sage" : "border-line bg-page"
              }`}
            >
              <input
                type="radio"
                name="otype"
                checked={orderType === o.id}
                onChange={() => {
                  setOrderType(o.id);
                  setPay(o.id === "DELIVERY" ? "COD" : "PAY_AT_RESTAURANT");
                }}
                className="accent-primary"
              />
              <div>
                <p className="text-[13px] font-semibold text-ink">{o.label}</p>
                <p className="text-[11px] text-muted">{o.sub}</p>
              </div>
            </label>
          ))}
        </Section>

        {(orderType === "DINE_IN" || orderType === "TAKEAWAY") && (
          <Section title={orderType === "DINE_IN" ? "When would you like to dine in?" : "When will you pick up?"}>
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
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`mb-2 flex cursor-pointer items-start gap-2.5 rounded-[14px] border-[1.5px] p-3.5 ${
                    addrId === a.id ? "border-primary bg-sage" : "border-line bg-page"
                  }`}
                >
                  <input
                    type="radio"
                    checked={addrId === a.id && !adding}
                    onChange={() => {
                      setAddrId(a.id);
                      setAdding(false);
                    }}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="text-[13px] text-ink">
                    <MapPin className="mb-1 size-3.5 text-accent" />
                    {a.street}, {a.city}, {a.state} {a.zipCode}
                  </div>
                </label>
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
                      onClick={() => {
                        if (!form.street || !form.city || !form.state || !form.zipCode)
                          return alert("Please fill in the full address");
                        const a = saveAddress(form);
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
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-accent" /> Schedule Delivery
                  </span>
                  <button
                    onClick={() => setSchedule((s) => !s)}
                    className={`relative h-6 w-11 rounded-full ${schedule ? "bg-primary" : "bg-line-soft"}`}
                  >
                    <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                      schedule ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                    />
                  </button>
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
              <Tag className="size-4 text-accent" /> Promo Code
            </span>
          }
        >
          {promo ? (
            <div className="flex items-center justify-between rounded-[14px] border border-accent/40 bg-accent/10 px-3.5 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-primary">
                <Check className="size-4 text-accent" /> {promo} · {COUPONS[promo].label}
              </span>
              <button
                onClick={() => {
                  setPromo(null);
                  setPromoInput("");
                }}
              >
                <X className="size-4 text-sub" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="h-11 flex-1 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm uppercase"
              />
              <button onClick={applyPromo} className="rounded-xl bg-primary px-4 text-[13px] font-bold text-white">
                Apply
              </button>
            </div>
          )}
          {promoErr && (
            <p className="mt-2 flex items-center gap-1 text-xs text-danger">
              <X className="size-3" /> {promoErr}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(COUPONS).map(([code, c]) => (
              <button
                key={code}
                onClick={() => {
                  setPromoInput(code);
                  setPromo(code);
                  setPromoErr("");
                }}
                className="rounded-full border border-line bg-page px-2.5 py-1 text-[11px] text-sub"
              >
                {code} · {c.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title={
            <span className="flex items-center gap-2">
              <Leaf className="size-4 text-accent" /> Cutlery
            </span>
          }
        >
          <button
            type="button"
            onClick={() => setNoCutlery((s) => !s)}
            className={`flex w-full items-center justify-between rounded-[14px] border-[1.5px] px-3.5 py-3 text-left ${
              noCutlery ? "border-primary bg-sage" : "border-line bg-page"
            }`}
          >
            <span>
              <span className="block text-[13px] font-bold text-ink">No cutlery, please</span>
              <span className="block text-[11px] text-sub">Skip plastic. Kitchen packs food only.</span>
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${noCutlery ? "bg-primary text-white" : "bg-sage text-primary"}`}>
              {noCutlery ? "On" : "Off"}
            </span>
          </button>
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

        <Section title="Order Summary">
          <div className="flex justify-between text-[13px] text-sub">
            <span>Subtotal</span>
            <span className="tabular">{inr(t.subtotal)}</span>
          </div>
          {orderType === "DELIVERY" && (
            <div className="flex justify-between text-[13px] text-sub">
              <span>Delivery Fee</span>
              <span>{t.deliveryFee === 0 ? "FREE" : inr(t.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px] text-sub">
            <span>Tax & charges (5%)</span>
            <span>{inr(t.tax)}</span>
          </div>
          {t.discount > 0 && (
            <div className="flex justify-between text-[13px] text-veg">
              <span>Promo {promo}</span>
              <span>−{inr(t.discount)}</span>
            </div>
          )}
          {t.tip > 0 && (
            <div className="flex justify-between text-[13px] text-primary">
              <span>Tip</span>
              <span>{inr(t.tip)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-line-soft pt-2.5 text-[15px] font-bold text-ink">
            <span>Total</span>
            <span>{inr(t.total)}</span>
          </div>
          {orderType === "DELIVERY" && (
            <p className="mt-3 rounded-2xl bg-sage px-3 py-2 text-[12px] leading-5 text-primary">
              At your gate by <b>{gateBy(etaMinOf(restaurantById(activeBag || bag[0]?.restaurantId)))}</b>
              . Shop keeps {SHOP_KEEP_PCT}% of this bill.
            </p>
          )}
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-[72px] z-30 px-4 pr-[76px] md:bottom-4 md:pr-[84px]">
        <div className="mx-auto flex max-w-[640px] items-center gap-3 rounded-[22px] bg-primary p-2 pl-5 text-white shadow-lift">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/65">Total</p>
            <p className="text-[15px] font-bold tabular">{inr(t.total)}</p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
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
