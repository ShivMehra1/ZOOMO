import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { MascotLoader } from "./LandingPage";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
  error: "#DC2626", pink: "#EC4899",
};

const PROMO_CODES = {
  ZOOMO50: { type: "percent", value: 50, label: "50% off", max: 100 },
  BOGO: { type: "flat", value: 60, label: "₹60 off", max: null },
  FREESHIP: { type: "ship", value: 29, label: "Free delivery", max: null },
  HEALTHY20: { type: "percent", value: 20, label: "20% off", max: 80 },
  NEWUSER: { type: "flat", value: 80, label: "₹80 off", max: null },
};
const TIP_OPTIONS = [0, 10, 20, 30, 50];
const DROP_OFF_OPTIONS = [
  { id: "MEET_DOOR", label: "Meet at door", hint: "Hand it to me" },
  { id: "LEAVE_DOOR", label: "Leave at door", hint: "No contact" },
  { id: "MEET_OUTSIDE", label: "Meet outside", hint: "I'll come to the gate" },
];

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
  ),
  MapPin: ({ color }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  Tag: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></svg>
  ),
  X: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  Check: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  Clock: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Heart: ({ size = 15, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
};

/* ── Order Success Animation ── */
function OrderSuccessAnimation({ onDone }) {
  const [stage, setStage] = useState("enter");
  useEffect(() => {
    const t1 = setTimeout(() => setStage("celebrate"), 500);
    const t2 = setTimeout(() => setStage("exit"), 3200);
    const t3 = setTimeout(() => onDone(), 3700);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999, background: C.page,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
      opacity: stage === "exit" ? 0 : 1, transition: "opacity 500ms"
    }}>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(1.8);opacity:0} }
        @keyframes confettiFall { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(30px) rotate(180deg)} }
      `}</style>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {stage === "celebrate" && (
          <>
            <div style={{
              position: "absolute", width: 140, height: 140, borderRadius: "50%",
              border: `2px solid ${C.accent}40`, animation: "ping 1.5s infinite"
            }} />
            <div style={{
              position: "absolute", width: 190, height: 190, borderRadius: "50%",
              border: `1px solid ${C.accent}20`, animation: "ping 1.5s infinite", animationDelay: "0.3s"
            }} />
          </>
        )}
        <div style={{
          position: "relative", zIndex: 10, width: 110, height: 110, borderRadius: "50%",
          background: C.primary, display: "flex", alignItems: "center", justifyContent: "center",
          transform: stage === "enter" ? "scale(0)" : stage === "celebrate" ? "scale(1.1)" : "scale(1)",
          transition: "all 500ms"
        }}>
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <path d="M6 10H22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M22 10L10 22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M10 22H26" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        </div>
        {stage === "celebrate" && [...Array(16)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", width: 7, height: 7, borderRadius: "50%",
            background: ["#1F7A52", "#34D399", "#6EE7B7", "#0F3D2D", "#F59E0B"][i % 5],
            left: `${50 + Math.cos(i * 22.5 * Math.PI / 180) * 90}px`,
            top: `${50 + Math.sin(i * 22.5 * Math.PI / 180) * 90}px`,
            animation: `confettiFall 1.2s ease-in ${i * 0.05}s infinite`
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center", opacity: stage === "enter" ? 0 : 1, transition: "opacity 500ms" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>Order Placed! 🎉</h2>
        <p style={{ color: C.primary, fontWeight: 600, fontSize: 14 }}>Zoomo is on it! Your food is being prepared.</p>
        <p style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>You'll receive updates in My Orders</p>
      </div>
      <div style={{ width: 200, height: 4, background: C.borderSoft, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: C.accent, borderRadius: 999,
          width: stage === "celebrate" ? "100%" : "0%",
          transition: stage === "celebrate" ? "width 2600ms linear" : "none"
        }} />
      </div>
    </div>
  );
}

/* ── Promo Flash ── */
function PromoFlash({ promo, onDone }) {
  const [visible, setVisible] = useState(true);
  const [popped, setPopped] = useState(false);
  useEffect(() => {
    const t0 = setTimeout(() => setPopped(true), 50);
    const t1 = setTimeout(() => setVisible(false), 2400);
    const t2 = setTimeout(() => onDone(), 2900);
    return () => [t0, t1, t2].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 998, pointerEvents: "none", display: "flex",
      alignItems: "flex-end", justifyContent: "center", paddingBottom: 112,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "all 500ms"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px 22px", borderRadius: 18,
        background: C.surface, border: `1px solid ${C.accent}50`, boxShadow: "0 8px 40px rgba(34,197,94,0.25)",
        transform: popped ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
        opacity: popped ? 1 : 0, transition: "all 400ms ease-out"
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", background: `${C.accent}20`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transform: popped ? "rotate(0)" : "rotate(-45deg)", transition: "transform 600ms"
        }}>
          <Icon.Tag size={17} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.textMain }}>
            🎉 <span style={{ color: C.accent }}>{promo.code}</span> applied!
          </p>
          <p style={{ color: C.primary, fontSize: 12, marginTop: 1 }}>{promo.label} saved on your order</p>
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, children }) {
  return (
    <div style={{
      marginBottom: 16, padding: 20, borderRadius: 20, background: C.surface,
      border: `1px solid ${C.border}`
    }}>
      <h3 style={{ fontWeight: 700, fontSize: 14, color: C.textMain, marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999, border: "none",
        background: checked ? C.primary : C.borderSoft, cursor: "pointer", transition: "background 200ms"
      }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 200ms"
      }} />
    </button>
  );
}

export default function Checkout() {
  const { cart, getSubtotal, itemUnitPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ street: "", city: "", state: "", zipCode: "", country: "India" });
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ORDER TYPE: "DELIVERY" | "DINE_IN" | "TAKEAWAY"
  const [orderType, setOrderType] = useState("DELIVERY");
  const [dineDate, setDineDate] = useState("");
  const [dineTime, setDineTime] = useState("");
  const [guestCount, setGuestCount] = useState(1);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [showPromoFlash, setShowPromoFlash] = useState(false);

  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);

  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [dropOff, setDropOff] = useState("MEET_DOOR");
  const [dropOffNote, setDropOffNote] = useState("");
  const [includeCutlery, setIncludeCutlery] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/addresses");
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAddresses(list);
        if (list.length > 0) setSelectedAddress(list[0].id);
        else setShowForm(true);
      } catch { setShowForm(true); }
      finally { setLoading(false); }
    }
    load();

    // Auto-apply an offer activated on the home page (localStorage), if any.
    try {
      const activated = JSON.parse(localStorage.getItem("ze_activated_offers") || "[]");
      const code = activated.find(c => PROMO_CODES[c]);
      if (code) setAppliedPromo({ code, ...PROMO_CODES[code] });
    } catch { /* ignore */ }
  }, []);

  const minDate = new Date().toISOString().split("T")[0];

  function getTimeSlots() {
    const slots = [];
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30 + 30, 0, 0);
    const end = new Date(now);
    end.setHours(23, 30, 0, 0);
    while (start <= end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setMinutes(start.getMinutes() + 30);
    }
    return slots;
  }

  function applyPromo() {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const found = PROMO_CODES[code];
    if (!found) { setPromoError("Invalid promo code. Try ZOOMO50, BOGO or FREESHIP."); return; }
    setAppliedPromo({ code, ...found });
    setPromoInput("");
    setShowPromoFlash(true);
  }

  function removePromo() {
    setAppliedPromo(null); setPromoError(""); setPromoInput("");
  }

  async function saveAddress() {
    if (!form.street || !form.city || !form.state || !form.zipCode) return alert("Fill all fields");
    try {
      const res = await api.post("/addresses", form);
      const addr = res?.data ?? res;
      setAddresses(p => [...p, addr]);
      setSelectedAddress(addr.id);
      setShowForm(false);
    } catch { alert("Failed to save address"); }
  }

  async function placeOrder() {
    if (orderType === "DELIVERY" && !selectedAddress) return alert("Select a delivery address");
    if (!paymentMethod) return alert("Select a payment method");
    if (orderType === "DELIVERY" && scheduleDelivery && (!scheduleDate || !scheduleTime)) return alert("Select a delivery date and time");
    if ((orderType === "DINE_IN" || orderType === "TAKEAWAY") && (!dineDate || !dineTime)) return alert(`Select a date and time for your ${orderType === "DINE_IN" ? "dine-in" : "takeaway"}`);
    setPlacing(true);
    try {
      await api.post("/orders", {
        restaurantId: cart.items[0].dish.restaurantId,
        addressId: orderType === "DELIVERY" ? selectedAddress : null,
        items: cart.items.map(i => ({ dishId: i.dish.id, quantity: i.quantity })),
        paymentMethod,
        // Backend only distinguishes DELIVERY vs PICKUP — dine-in/takeaway both
        // mean the customer collects it themselves.
        orderType: orderType === "DELIVERY" ? "DELIVERY" : "PICKUP",
        dropOffPreference: orderType === "DELIVERY" ? dropOff : null,
        dropOffNote: orderType === "DELIVERY" ? dropOffNote.trim() || null : null,
        includeCutlery,
        promoCode: appliedPromo?.code ?? null,
        tip: tipAmount,
        guestCount: orderType === "DINE_IN" ? guestCount : null,
        scheduledFor: orderType === "DELIVERY" && scheduleDelivery
          ? `${scheduleDate}T${scheduleTime}:00`
          : (orderType !== "DELIVERY")
            ? `${dineDate}T${dineTime}:00`
            : null,
      });
      clearCart().catch(() => { });
      setPlacing(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("Place order error:", err);
      alert("Failed to place order. Try again.");
      setPlacing(false);
    }
  }

  if (loading) return <MascotLoader text="Loading checkout..." />;
  if (placing) return <MascotLoader text="Placing your order... 🍔" />;

  const subtotal = parseFloat(getSubtotal().toFixed(2));
  const delivery = appliedPromo?.type === "ship" ? 0 : 29;
  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const tipAmount = showCustomTip && customTip ? parseFloat(parseFloat(customTip).toFixed(2)) || 0 : tip;

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") {
      discount = parseFloat(Math.min(subtotal * appliedPromo.value / 100, appliedPromo.max ?? Infinity).toFixed(2));
    } else if (appliedPromo.type === "flat") {
      discount = parseFloat(Math.min(appliedPromo.value, subtotal).toFixed(2));
    }
  }

  const total = (
    Math.round(subtotal * 100) + Math.round(delivery * 100) + Math.round(tax * 100) +
    Math.round(tipAmount * 100) - Math.round(discount * 100)
  ) / 100;

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`,
    background: C.surface, color: C.textMain, fontSize: 13, outline: "none", fontFamily: "inherit",
    transition: "border-color 120ms",
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.page, paddingBottom: 40,
      fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      {showSuccess && <OrderSuccessAnimation onDone={() => navigate("/orders")} />}
      {showPromoFlash && appliedPromo && <PromoFlash promo={appliedPromo} onDone={() => setShowPromoFlash(false)} />}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${C.border}`,
              background: C.surface, display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textSub, cursor: "pointer"
            }}>
            <Icon.ArrowLeft />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textMain, letterSpacing: "-0.015em" }}>Checkout</h1>
        </div>

        {/* ── ORDER TYPE ── */}
        <Section title="How would you like this order?">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { id: "DELIVERY", label: "🛵 Delivery", sub: "Delivered to your door" },
              { id: "DINE_IN", label: "🍽️ Dine In", sub: "Eat at the restaurant" },
              { id: "TAKEAWAY", label: "🥡 Takeaway", sub: "Pick up yourself" },
            ].map(opt => (
              <label key={opt.id} onClick={() => { setOrderType(opt.id); setPaymentMethod(null); }}
                style={{
                  flex: 1, minWidth: 120, display: "flex", flexDirection: "column", gap: 3,
                  padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                  border: `1.5px solid ${orderType === opt.id ? C.accent : C.border}`,
                  background: orderType === opt.id ? `${C.accent}0D` : C.page,
                  transition: "all 120ms"
                }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.textMain }}>{opt.label}</span>
                <span style={{ fontSize: 11, color: C.textSub }}>{opt.sub}</span>
              </label>
            ))}
          </div>

          {/* Date + Time for Dine In / Takeaway */}
          {(orderType === "DINE_IN" || orderType === "TAKEAWAY") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              <p style={{ fontSize: 12, color: C.textSub }}>
                {orderType === "DINE_IN" ? "When would you like to dine in?" : "When will you pick up?"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, display: "block" }}>Date</label>
                  <input type="date" min={new Date().toISOString().split("T")[0]}
                    value={dineDate} onChange={e => setDineDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, display: "block" }}>Time</label>
                  <select value={dineTime} onChange={e => setDineTime(e.target.value)} style={inputStyle}>
                    <option value="">Select time</option>
                    {getTimeSlots().map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {orderType === "DINE_IN" && (
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, display: "block" }}>Number of guests</label>
                  <select value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} style={inputStyle}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </div>
              )}
              {dineDate && dineTime && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                  borderRadius: 10, background: `${C.accent}15`, border: `1px solid ${C.accent}30`,
                  color: C.primary, fontSize: 12
                }}>
                  ✓ {orderType === "DINE_IN" ? "Dine-in" : "Takeaway"} booked for{" "}
                  {new Date(`${dineDate}T${dineTime}`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {orderType === "DINE_IN" && ` · ${guestCount} ${guestCount === 1 ? "guest" : "guests"}`}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Delivery Address — only shown for DELIVERY orders */}
        {orderType === "DELIVERY" && <Section title="Delivery Address">
          {!showForm && addresses.map(a => (
            <label key={a.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: 14,
              borderRadius: 14, border: `1.5px solid ${selectedAddress === a.id ? C.accent : C.border}`,
              background: selectedAddress === a.id ? `${C.accent}0D` : C.page, cursor: "pointer"
            }}>
              <input type="radio" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)}
                style={{ marginTop: 3, accentColor: C.primary }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon.MapPin color={C.accent} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: C.textMain }}>{a.street}</span>
                </div>
                <p style={{ color: C.textSub, fontSize: 12, marginTop: 3 }}>{a.city}, {a.state} - {a.zipCode}</p>
              </div>
            </label>
          ))}
          {showForm && (
            <>
              {["street", "city", "state", "zipCode"].map(f => (
                <input key={f} placeholder={f[0].toUpperCase() + f.slice(1)} value={form[f]}
                  onChange={e => setForm({ ...form, [f]: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border} />
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveAddress}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12, border: "none", background: C.primary,
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                  }}>
                  Save Address
                </button>
                {addresses.length > 0 && (
                  <button onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${C.border}`,
                      background: "transparent", color: C.textSub, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                    }}>
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              style={{
                background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", textAlign: "left", padding: 0
              }}>
              + Add new address
            </button>
          )}
        </Section>}

        {/* Schedule Delivery — only for delivery orders */}
        {orderType === "DELIVERY" && <Section title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon.Clock color={C.accent} /><span>Schedule Delivery</span>
            </div>
            <Toggle checked={scheduleDelivery} onChange={() => setScheduleDelivery(v => !v)} />
          </div>
        }>
          {!scheduleDelivery ? (
            <p style={{ color: C.textMuted, fontSize: 12 }}>Deliver as soon as possible (25–40 min)</p>
          ) : (
            <>
              <p style={{ color: C.textSub, fontSize: 12 }}>Pick a date and time for your delivery</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, display: "block" }}>Date</label>
                  <input type="date" min={minDate} value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, display: "block" }}>Time</label>
                  <select value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={inputStyle}>
                    <option value="">Select time</option>
                    {getTimeSlots().map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {scheduleDate && scheduleTime && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10,
                  background: `${C.accent}15`, border: `1px solid ${C.accent}30`, color: C.primary, fontSize: 12
                }}>
                  <Icon.Check />
                  Scheduled for {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              )}
            </>
          )}
        </Section>}

        {/* Drop-off preference — delivery only */}
        {orderType === "DELIVERY" && <Section title="Drop-off preference">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DROP_OFF_OPTIONS.map(opt => (
              <label key={opt.id} onClick={() => setDropOff(opt.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
                  borderRadius: 14, cursor: "pointer",
                  border: `1.5px solid ${dropOff === opt.id ? C.accent : C.border}`,
                  background: dropOff === opt.id ? `${C.accent}0D` : C.page,
                }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: C.textMain }}>{opt.label}</p>
                  <p style={{ color: C.textMuted, fontSize: 11 }}>{opt.hint}</p>
                </div>
                <input type="radio" checked={dropOff === opt.id} onChange={() => setDropOff(opt.id)} style={{ accentColor: C.primary }} />
              </label>
            ))}
          </div>
          <input value={dropOffNote} onChange={e => setDropOffNote(e.target.value)}
            placeholder="Note for the rider (optional)"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border} />
        </Section>}

        {/* Cutlery */}
        <Section title="Cutlery">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>Include cutlery</p>
              <p style={{ fontSize: 11, color: C.textMuted }}>Skip it to cut down on plastic</p>
            </div>
            <Toggle checked={includeCutlery} onChange={() => setIncludeCutlery(v => !v)} />
          </div>
        </Section>

        {/* Tip */}
        <Section title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon.Heart color={C.pink} /><span>Tip Your Delivery Partner</span>
          </div>
        }>
          <p style={{ color: C.textMuted, fontSize: 12 }}>100% of the tip goes directly to your delivery partner 💚</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIP_OPTIONS.map(t => (
              <button key={t} onClick={() => { setTip(t); setShowCustomTip(false); setCustomTip(""); }}
                style={{
                  padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                  border: `1.5px solid ${tip === t && !showCustomTip ? C.pink : C.border}`,
                  background: tip === t && !showCustomTip ? `${C.pink}12` : C.page,
                  color: tip === t && !showCustomTip ? C.pink : C.textSub
                }}>
                {t === 0 ? "No tip" : `₹${t}`}
              </button>
            ))}
            <button onClick={() => { setShowCustomTip(true); setTip(0); }}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
                border: `1.5px solid ${showCustomTip ? C.pink : C.border}`,
                background: showCustomTip ? `${C.pink}12` : C.page,
                color: showCustomTip ? C.pink : C.textSub
              }}>
              Custom
            </button>
          </div>
          {showCustomTip && (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>₹</span>
              <input type="number" min="0" max="500" placeholder="Enter amount" value={customTip}
                onChange={e => setCustomTip(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => e.target.style.borderColor = C.pink}
                onBlur={e => e.target.style.borderColor = C.border} />
            </div>
          )}
        </Section>

        {/* Payment Method */}
        <Section title="Payment Method">
          {(orderType === "DINE_IN" || orderType === "TAKEAWAY") ? (
            // Dine-in / Takeaway payment options
            [
              { id: "PAY_AT_RESTAURANT", label: "💵 Pay at Restaurant", sub: "Pay in cash or card when you arrive" },
              { id: "ONLINE", label: "💳 Online Payment", sub: "Coming soon", disabled: true },
            ].map(p => (
              <label key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 14,
                cursor: p.disabled ? "not-allowed" : "pointer", opacity: p.disabled ? 0.45 : 1,
                border: `1.5px solid ${paymentMethod === p.id ? C.accent : C.border}`,
                background: paymentMethod === p.id ? `${C.accent}0D` : C.page
              }}>
                <input type="radio" name="payment" disabled={p.disabled} checked={paymentMethod === p.id}
                  onChange={() => !p.disabled && setPaymentMethod(p.id)} style={{ accentColor: C.primary }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: C.textMain }}>{p.label}</p>
                  <p style={{ color: C.textMuted, fontSize: 11 }}>{p.sub}</p>
                </div>
              </label>
            ))
          ) : (
            // Delivery payment options
            [
              { id: "COD", label: "💰 Cash on Delivery", sub: "Pay when your order arrives" },
              { id: "ONLINE", label: "💳 Online Payment", sub: "Coming soon", disabled: true },
            ].map(p => (
              <label key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 14,
                cursor: p.disabled ? "not-allowed" : "pointer", opacity: p.disabled ? 0.45 : 1,
                border: `1.5px solid ${paymentMethod === p.id ? C.accent : C.border}`,
                background: paymentMethod === p.id ? `${C.accent}0D` : C.page
              }}>
                <input type="radio" name="payment" disabled={p.disabled} checked={paymentMethod === p.id}
                  onChange={() => !p.disabled && setPaymentMethod(p.id)} style={{ accentColor: C.primary }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: C.textMain }}>{p.label}</p>
                  <p style={{ color: C.textMuted, fontSize: 11 }}>{p.sub}</p>
                </div>
              </label>
            ))
          )}
        </Section>

        {/* Promo Code */}
        <Section title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon.Tag color={C.accent} /><span>Promo Code</span>
          </div>
        }>
          {appliedPromo ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
              borderRadius: 14, background: `${C.accent}12`, border: `1px solid ${C.accent}40`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon.Tag color={C.primary} size={15} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: C.primary }}>{appliedPromo.code}</p>
                  <p style={{ color: C.hover, fontSize: 11 }}>{appliedPromo.label} applied!</p>
                </div>
              </div>
              <button onClick={removePromo}
                style={{
                  padding: 6, borderRadius: 8, background: C.surface, border: "none",
                  color: C.textMuted, cursor: "pointer"
                }}>
                <Icon.X />
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyPromo()}
                  placeholder="Enter promo code"
                  style={{ ...inputStyle, flex: 1, textTransform: "uppercase", letterSpacing: "0.03em" }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border} />
                <button onClick={applyPromo}
                  style={{
                    padding: "0 20px", borderRadius: 12, border: "none", background: C.primary,
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                  }}>
                  Apply
                </button>
              </div>
              {promoError && (
                <p style={{ color: C.error, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon.X size={11} /> {promoError}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(PROMO_CODES).map(([code, info]) => (
                  <button key={code} onClick={() => { setPromoInput(code); setPromoError(""); }}
                    style={{
                      fontSize: 10, padding: "5px 10px", borderRadius: 10, border: `1px solid ${C.border}`,
                      background: C.page, color: C.textMuted, cursor: "pointer", fontFamily: "inherit",
                      transition: "all 120ms"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                    {code} · {info.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* Order Summary */}
        <Section title="Order Summary">
          {cart.items.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub }}>
              <span>{i.dish.name}{i.dishSizeId && i.dish.sizes?.find(s => s.id === i.dishSizeId) ? ` (${i.dish.sizes.find(s => s.id === i.dishSizeId).label})` : ""} × {i.quantity}</span>
              <span>₹{(itemUnitPrice(i) * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{
            borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12, marginTop: 4,
            display: "flex", flexDirection: "column", gap: 8
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub }}>
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub }}>
              <span>Delivery</span>
              {appliedPromo?.type === "ship" ? <span style={{ color: C.accent, fontWeight: 600 }}>FREE</span> : <span>₹{delivery.toFixed(2)}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub }}>
              <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
            </div>
            {tipAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.pink }}>
                <span>Tip 💚</span><span>₹{tipAmount.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.accent, fontWeight: 600 }}>
                <span>Discount ({appliedPromo?.code})</span><span>− ₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              borderTop: `1px solid ${C.borderSoft}`, paddingTop: 10, marginTop: 2,
              display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: C.textMain
            }}>
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </Section>

        <button onClick={placeOrder}
          style={{
            width: "100%", padding: "16px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(15,61,46,0.25)", transition: "box-shadow 120ms"
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,61,46,0.35)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.25)"}>
          {orderType === "DINE_IN"
            ? `Book Dine-In · ₹${total.toFixed(2)}`
            : orderType === "TAKEAWAY"
              ? `Confirm Takeaway · ₹${total.toFixed(2)}`
              : scheduleDelivery && scheduleDate && scheduleTime
                ? `Schedule Delivery · ₹${total.toFixed(2)}`
                : `Place Order · ₹${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}