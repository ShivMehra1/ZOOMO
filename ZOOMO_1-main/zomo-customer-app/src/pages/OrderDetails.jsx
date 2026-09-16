import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { MascotLoader } from "./LandingPage";
import LiveMap from "../components/LiveMap";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
  danger: "#B42318", sage: "#D7E6DE",
};

/* ── Schematic map — abstract Jourian-area layout, not real GPS ── */
const MAP_NODES = [
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
const ROADS = [
  "M4 46 C 24 42, 40 48, 52 44 C 68 40, 84 50, 96 52",
  "M50 8 C 51 24, 52 36, 52 44 C 51 60, 54 78, 55 96",
  "M12 18 C 28 28, 40 38, 52 44",
  "M88 16 C 74 28, 62 38, 52 44",
  "M10 72 C 26 62, 40 52, 52 44",
  "M90 74 C 74 62, 62 52, 52 44",
  "M20 92 C 34 76, 44 56, 52 44",
  "M76 94 C 66 76, 56 56, 52 44",
];

function mapNode(name) {
  const hub = MAP_NODES.find(n => n.hub) ?? MAP_NODES[0];
  if (!name) return hub;
  const lower = String(name).toLowerCase();
  return MAP_NODES.find(n => lower.includes(n.name.toLowerCase())) ?? hub;
}
function routePath(fromName, toName) {
  const a = mapNode(fromName);
  const b = mapNode(toName);
  const hub = MAP_NODES.find(n => n.hub) ?? a;
  if (a.name === b.name) return `M${a.x} ${a.y} c 6 -8, 14 -8, 16 0`;
  return `M${a.x} ${a.y} Q ${hub.x} ${hub.y} ${b.x} ${b.y}`;
}

function FollowPath({ d, t }) {
  const ref = useRef(null);
  const [len, setLen] = useState(0);
  useLayoutEffect(() => { if (ref.current) setLen(ref.current.getTotalLength()); }, [d]);
  if (!d) return null;
  return (
    <path ref={ref} d={d} fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round"
      strokeDasharray={len || 1} strokeDashoffset={(len || 1) * (1 - t)} />
  );
}

function RiderPin({ d, t }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const len = el.getTotalLength();
    const pt = el.getPointAtLength(len * Math.max(0, Math.min(1, t)));
    setPos({ x: pt.x, y: pt.y });
  }, [d, t]);
  return (
    <>
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, pointerEvents: "none" }}>
        <path ref={ref} d={d} />
      </svg>
      {pos && (
        <div style={{
          position: "absolute", zIndex: 2, left: `${pos.x}%`, top: `${pos.y}%`,
          transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: "50%",
          background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)", pointerEvents: "none",
          transition: "left 900ms linear, top 900ms linear"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6a1 1 0 0 0-1-1h-3l3.6 5.5M12 17.5V14l-3-3 4-3 2 3h2" />
          </svg>
        </div>
      )}
    </>
  );
}

function SchematicMap({ from, to, ride = 0, showRider }) {
  const d = routePath(from, to);
  const a = mapNode(from);
  const b = mapNode(to);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#EEF3F0" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect width="100" height="100" fill="#EEF3F0" />
        <circle cx="52" cy="44" r="28" fill={C.sage} />
        {ROADS.map(r => <path key={r} d={r} fill="none" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />)}
        {ROADS.map(r => <path key={`i-${r}`} d={r} fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" />)}
        <path d={d} fill="none" stroke={`${C.accent}55`} strokeWidth="2" strokeLinecap="round" />
        <FollowPath d={d} t={ride} />
        {MAP_NODES.map(n => {
          const on = a.name === n.name || b.name === n.name;
          return (
            <g key={n.name}>
              <circle cx={n.x} cy={n.y} r={n.hub ? 5 : 4} fill={on || n.hub ? C.primary : "#fff"} stroke={C.primary} strokeWidth="1" />
              <text x={n.x} y={n.y + 1.4} textAnchor="middle" fill={on || n.hub ? "#fff" : C.primary} fontSize="4" fontWeight="700">
                {n.name[0]}
              </text>
            </g>
          );
        })}
      </svg>
      {showRider && <RiderPin d={d} t={ride} />}
    </div>
  );
}

const DELIVERY_STEPS = [
  { key: "PENDING", label: "Placed", hint: "Restaurant got the ticket" },
  { key: "PREPARING", label: "Preparing", hint: "On the stove now" },
  { key: "READY_FOR_PICKUP", label: "Picking up", hint: "Rider heading to the restaurant" },
  { key: "OUT_FOR_DELIVERY", label: "On the way", hint: "Bag is on the bike" },
  { key: "DELIVERED", label: "Delivered", hint: "At your gate" },
];
const PICKUP_STEPS = [
  { key: "PENDING", label: "Placed", hint: "Order received" },
  { key: "PREPARING", label: "Preparing", hint: "Almost plated" },
  { key: "READY_FOR_PICKUP", label: "Ready", hint: "Come collect" },
  { key: "DELIVERED", label: "Completed", hint: "Picked up" },
];
const DROP_OFF = [
  { id: "MEET_DOOR", label: "Meet at door", hint: "Hand it to me" },
  { id: "LEAVE_DOOR", label: "Leave at door", hint: "No contact" },
  { id: "MEET_OUTSIDE", label: "Meet outside", hint: "I'll come to the gate" },
];

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
  ),
  Chevron: ({ up }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {up ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  ),
  Phone: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  Star: ({ filled }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? C.primary : "none"} stroke={filled ? C.primary : C.border} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  MessageCircle: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  Help: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
  ),
  X: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState("mini");
  const [dropOpen, setDropOpen] = useState(false);
  const [dropChoice, setDropChoice] = useState("MEET_DOOR");
  const [dropNoteDraft, setDropNoteDraft] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const chatEndRef = useRef(null);

  async function load(silent) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (!order || order.status === "DELIVERED" || order.status === "CANCELLED") return;
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, id]);

  function ping(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function doCancel() {
    setBusy(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      await load(true);
    } catch {
      ping("Could not cancel this order");
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  async function doRate(n) {
    try {
      await api.patch(`/orders/${id}/rate`, { rating: n });
      await load(true);
    } catch {
      ping("Could not save rating");
    }
  }

  async function doGatePing() {
    try {
      await api.patch(`/orders/${id}/gate-ping`);
      ping("Pinged — you're at the gate");
      await load(true);
    } catch {
      ping("Could not ping");
    }
  }

  function openDropSheet() {
    setDropChoice(order.dropOffPreference || "MEET_DOOR");
    setDropNoteDraft(order.dropOffNote || "");
    setDropOpen(true);
  }

  async function saveDropOff() {
    try {
      await api.patch(`/orders/${id}/drop-off`, { preference: dropChoice, note: dropNoteDraft });
      setDropOpen(false);
      await load(true);
    } catch {
      ping("Could not update drop-off");
    }
  }

  async function loadMessages() {
    try {
      const res = await api.get(`/orders/${id}/messages`);
      setMessages(Array.isArray(res) ? res : []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    if (!chatOpen) return;
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  async function sendChat(e) {
    e.preventDefault();
    const text = chatText.trim();
    if (!text) return;
    setChatText("");
    try {
      await api.post(`/orders/${id}/messages`, { text });
      await loadMessages();
    } catch {
      ping("Message could not be sent");
    }
  }

  // Auto-grant a late credit once the promised time has passed, matching the
  // reference's "clock credit applies automatically" behaviour.
  useEffect(() => {
    if (!order?.promisedAt || order.lateCreditApplied) return;
    const active = order.status !== "DELIVERED" && order.status !== "CANCELLED";
    if (!active) return;
    if (Date.now() > new Date(order.promisedAt).getTime()) {
      api.patch(`/orders/${id}/late-credit`).then(() => load(true)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.promisedAt, order?.status, order?.lateCreditApplied, id]);

  if (loading) return <MascotLoader text="Loading order..." />;

  if (!order) return (
    <div style={{
      minHeight: "100vh", background: C.page, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <p style={{ color: C.textSub }}>Order not found</p>
    </div>
  );

  const isPickup = order.orderType === "PICKUP";
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const idx = Math.max(0, steps.findIndex(s => s.key === order.status));
  const active = order.status !== "DELIVERED" && order.status !== "CANCELLED";
  const cancelled = order.status === "CANCELLED";
  const progress = cancelled ? 0 : Math.min(1, (idx + (order.status === "DELIVERED" ? 1 : 0.5)) / steps.length);
  const ride = cancelled ? 0 : idx / Math.max(1, steps.length - 1);
  const rider = !isPickup && order.driver ? order.driver : null;
  const showRider = Boolean(rider) && !cancelled && idx >= steps.findIndex(s => s.key === "READY_FOR_PICKUP");
  const drop = DROP_OFF.find(d => d.id === (order.dropOffPreference || "MEET_DOOR"));
  const headline = cancelled
    ? "Order cancelled"
    : order.status === "DELIVERED"
      ? "Enjoy your food"
      : (steps[idx]?.label || "Placed");
  const late = active && order.promisedAt && Date.now() > new Date(order.promisedAt).getTime();
  const restaurantPoint = { lat: order.restaurant?.lat, lng: order.restaurant?.lng };
  const destinationPoint = order.address?.lat
    ? { lat: order.address.lat, lng: order.address.lng }
    : null;
  const driverPoint = rider?.currentLat ? { lat: rider.currentLat, lng: rider.currentLng } : null;
  const hasRealMap = Boolean(restaurantPoint.lat);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 40, background: C.sage, fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      {/* Map */}
      <div style={{ position: "absolute", inset: 0, bottom: sheet === "full" ? "72%" : "42%" }}>
        {isPickup ? (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            color: C.primary, fontSize: 13, fontWeight: 700, background: C.sage
          }}>
            Pickup order · no rider needed
          </div>
        ) : hasRealMap ? (
          <LiveMap restaurant={restaurantPoint} destination={destinationPoint} driver={driverPoint} isPickup={isPickup} />
        ) : (
          <SchematicMap from={order.restaurant?.address} to={order.address?.city} ride={ride} showRider={showRider} />
        )}
      </div>

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, insetInline: 0, zIndex: 30, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "12px 12px 0"
      }}>
        <button onClick={() => navigate("/orders")}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", color: C.textMain,
            cursor: "pointer", boxShadow: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)"
          }}>
          <Icon.ArrowLeft />
        </button>
        <div style={{
          borderRadius: 999, background: "rgba(255,255,255,0.95)", padding: "7px 14px",
          fontSize: 12, fontWeight: 700, color: C.textMain, boxShadow: "0 1px 6px rgba(0,0,0,0.1)"
        }}>
          Order #{order.id.slice(0, 6).toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {rider && active && (
            <button onClick={() => setChatOpen(true)}
              style={{
                width: 44, height: 44, borderRadius: "50%", border: "none", background: "#fff", color: C.textMain,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)"
              }}>
              <Icon.MessageCircle />
            </button>
          )}
          <button onClick={() => setHelpOpen(true)}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none", background: "#fff", color: C.textMain,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              boxShadow: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)"
            }}>
            <Icon.Help />
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: "absolute", insetInline: 0, bottom: 0, zIndex: 30, overflow: "hidden",
        borderTopLeftRadius: 28, borderTopRightRadius: 28, background: C.surface,
        boxShadow: "0 0 0 1px rgba(15,61,45,0.1), 0 16px 40px rgba(15,61,45,0.12)",
        height: sheet === "full" ? "72%" : "42%", transition: "height 300ms"
      }}>
        <button onClick={() => setSheet(s => s === "full" ? "mini" : "full")}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 4
          }}>
          <span style={{ height: 5, width: 40, borderRadius: 999, background: C.border }} />
          <span style={{ marginTop: 4, color: C.textMuted }}><Icon.Chevron up={sheet === "full"} /></span>
        </button>

        <div style={{ height: "calc(100% - 28px)", overflowY: "auto", padding: "0 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: C.textMuted, textTransform: "uppercase" }}>
                {order.restaurant?.name}
              </p>
              <h1 style={{ marginTop: 4, fontSize: 21, fontWeight: 700, color: C.textMain }}>{headline}</h1>
              <p style={{ marginTop: 4, fontSize: 13, color: C.textSub }}>{steps[idx]?.hint}</p>
            </div>
          </div>

          <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: C.page, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, background: C.primary, width: `${Math.round(progress * 100)}%`, transition: "width 500ms" }} />
          </div>
          <ol style={{ marginTop: 10, display: "flex", gap: 4, listStyle: "none", padding: 0 }}>
            {steps.map((s, i) => (
              <li key={s.key} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", height: 4, borderRadius: 999, background: i <= idx ? C.primary : C.border }} />
                <p style={{
                  marginTop: 4, fontSize: 10, fontWeight: 700, color: i === idx ? C.textMain : C.textMuted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {s.label}
                </p>
              </li>
            ))}
          </ol>

          {(order.lateCreditApplied || late) && active && (
            <p style={{ marginTop: 12, borderRadius: 16, background: C.sage, color: C.primary, fontWeight: 700, fontSize: 13, padding: "10px 14px" }}>
              Past the clock. ₹{order.lateCreditApplied || 40} off this order.
            </p>
          )}

          {rider && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, borderRadius: 22, background: C.page, padding: 12 }}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(rider.user?.name || "Rider")}&background=0F3D2D&color=fff&size=96`}
                alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{rider.user?.name || "Your rider"}</p>
                <p style={{ fontSize: 12, color: C.textSub }}>{rider.vehicleType || "Bike"} · {rider.vehiclePlate || "—"}</p>
                <p style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: C.textMain, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon.Star filled /> {(rider.rating ?? 4.8).toFixed(1)}
                </p>
              </div>
              {active && rider.user?.phone && (
                <a href={`tel:${rider.user.phone}`}
                  style={{
                    width: 42, height: 42, borderRadius: "50%", background: C.primary, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                  <Icon.Phone />
                </a>
              )}
            </div>
          )}

          {!isPickup && active && (
            <button onClick={openDropSheet}
              style={{
                marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: 22, background: C.page, padding: "12px 16px", border: "none", cursor: "pointer", textAlign: "left"
              }}>
              <span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: C.textMuted, textTransform: "uppercase" }}>Drop-off</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{drop?.label}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>Change</span>
            </button>
          )}

          {order.address && !isPickup && (
            <p style={{ marginTop: 12, fontSize: 13, color: C.textSub }}>
              <span style={{ fontWeight: 700, color: C.textMain }}>Deliver to </span>
              {order.address.street}, {order.address.city}
            </p>
          )}

          {!isPickup && active && (
            <button onClick={doGatePing}
              style={{
                marginTop: 10, width: "100%", height: 42, borderRadius: 12, border: `1.5px solid ${C.border}`,
                background: C.surface, color: C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>
              {order.gatePingAt ? "Pinged · I'm at the gate" : "I'm at the gate"}
            </button>
          )}

          {sheet === "full" && (
            <>
              <div style={{ marginTop: 20, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 16 }}>
                <p style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.textMain }}>Items</p>
                {order.items.map(i => (
                  <div key={i.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.textSub }}>{i.dish?.name} × {i.quantity}</span>
                    <span style={{ fontWeight: 600, color: C.textMain }}>₹{(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15,
                  borderTop: `1px solid ${C.borderSoft}`, paddingTop: 8
                }}>
                  <span>Total</span><span>₹{order.total?.toFixed?.(2) ?? order.total}</span>
                </div>
              </div>

              {order.status === "DELIVERED" && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.textMain }}>
                    Rate {rider ? "your rider" : "this order"}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => doRate(n)} aria-label={`${n} stars`} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Icon.Star filled={n <= (order.rating || 0)} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/restaurant/${order.restaurantId}`)}
                    style={{
                      marginTop: 16, width: "100%", height: 46, borderRadius: 14, border: "none",
                      background: C.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit"
                    }}>
                    Order again
                  </button>
                </div>
              )}

              {active && (
                <button onClick={() => setConfirmCancel(true)}
                  style={{
                    marginTop: 16, width: "100%", padding: "10px 0", background: "none", border: "none",
                    color: C.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
                  }}>
                  Cancel order
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drop-off sheet */}
      {dropOpen && (
        <div onClick={e => e.target === e.currentTarget && setDropOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(12,22,18,0.4)" }}>
          <div style={{ width: "100%", maxWidth: 480, borderTopLeftRadius: 28, borderTopRightRadius: 28, background: C.surface, padding: "20px 20px 32px" }}>
            <h3 style={{ marginBottom: 14, fontSize: 16, fontWeight: 700, color: C.textMain }}>Drop-off</h3>
            {DROP_OFF.map(o => (
              <button key={o.id} onClick={() => setDropChoice(o.id)}
                style={{
                  marginBottom: 8, width: "100%", textAlign: "left", borderRadius: 16, border: "none", cursor: "pointer",
                  padding: "12px 16px", background: dropChoice === o.id ? C.sage : C.page
                }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{o.label}</p>
                <p style={{ fontSize: 12, color: C.textSub }}>{o.hint}</p>
              </button>
            ))}
            <input value={dropNoteDraft} onChange={e => setDropNoteDraft(e.target.value)} placeholder="Note for the rider (optional)"
              style={{
                width: "100%", marginTop: 4, marginBottom: 14, padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box"
              }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDropOpen(false)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textSub, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={saveDropOff}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,22,18,0.4)", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 360, borderRadius: 24, background: C.surface, padding: 20, boxShadow: "0 16px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.textMain }}>Cancel this order?</h3>
            <p style={{ marginTop: 8, fontSize: 13, color: C.textSub }}>
              {order.status === "OUT_FOR_DELIVERY" ? "Rider already has it. We'll still try to stop the drop." : "The kitchen will stop preparing it."}
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCancel(false)} disabled={busy}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textSub, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Keep it
              </button>
              <button onClick={doCancel} disabled={busy}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: C.danger, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1 }}>
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat with rider */}
      {chatOpen && rider && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}`, padding: "14px 16px" }}>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMain }}>
              <Icon.X />
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{rider.user?.name || "Your rider"}</p>
              <p style={{ fontSize: 11, color: C.textMuted }}>Usually replies in a minute</p>
            </div>
            {rider.user?.phone && (
              <a href={`tel:${rider.user.phone}`}
                style={{ width: 38, height: 38, borderRadius: "50%", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon.Phone />
              </a>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", background: C.page, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ textAlign: "center", color: C.textMuted, fontSize: 12, marginTop: 20 }}>No messages yet — say hello 👋</p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "CUSTOMER" ? "flex-end" : "flex-start" }}>
                <p style={{
                  maxWidth: "78%", padding: "9px 13px", borderRadius: 16, fontSize: 13, lineHeight: "18px",
                  background: m.sender === "CUSTOMER" ? C.primary : C.surface,
                  color: m.sender === "CUSTOMER" ? "#fff" : C.textMain,
                  boxShadow: m.sender === "CUSTOMER" ? "none" : "0 1px 4px rgba(0,0,0,0.06)"
                }}>
                  {m.text}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.border}` }}>
            <input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="I'm at the gate…"
              style={{
                flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${C.border}`, padding: "0 14px",
                fontSize: 13, fontFamily: "inherit", outline: "none"
              }} />
            <button type="submit" style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon.Send />
            </button>
          </form>
        </div>
      )}

      {/* Help */}
      {helpOpen && (
        <div onClick={e => e.target === e.currentTarget && setHelpOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(12,22,18,0.4)" }}>
          <div style={{ width: "100%", maxWidth: 480, borderTopLeftRadius: 28, borderTopRightRadius: 28, background: C.surface, padding: "20px 20px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.textMain }}>Help</h3>
              <button onClick={() => setHelpOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}><Icon.X /></button>
            </div>
            {[
              ["Missing item", "We'll ping the kitchen."],
              ["Wrong order", "Show us a photo after drop."],
              ["It's late", "Clock credit applies automatically."],
              ["Rider issue", "Call or message them from this screen."],
            ].map(([t, h]) => (
              <button key={t} onClick={() => { setHelpOpen(false); ping("Logged. We'll look into it."); }}
                style={{ marginBottom: 8, width: "100%", textAlign: "left", borderRadius: 16, border: "none", cursor: "pointer", padding: "12px 16px", background: C.page }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.textMain }}>{t}</p>
                <p style={{ fontSize: 12, color: C.textSub }}>{h}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "46%", zIndex: 90, display: "flex", justifyContent: "center", pointerEvents: "none", padding: "0 16px" }}>
          <p style={{ borderRadius: 999, background: C.primary, color: "#fff", padding: "10px 18px", fontSize: 13, fontWeight: 700, boxShadow: "0 16px 40px rgba(15,61,45,0.12)" }}>
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}
