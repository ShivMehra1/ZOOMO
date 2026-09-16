import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { MascotLoader } from "./LandingPage";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
};

const STATUS_STYLE = {
  SCHEDULED: { color: "#D97706", bg: "#FEF3C7" },
  PENDING: { color: "#D97706", bg: "#FEF3C7" },
  PREPARING: { color: "#EA580C", bg: "#FFEDD5" },
  READY_FOR_PICKUP: { color: "#7C3AED", bg: "#EDE9FE" },
  OUT_FOR_DELIVERY: { color: "#0284C7", bg: "#E0F2FE" },
  DELIVERED: { color: "#16A34A", bg: "#DCFCE7" },
  CANCELLED: { color: "#DC2626", bg: "#FEE2E2" },
};

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  ),
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine")
      .then(res => setOrders(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MascotLoader text="Loading your orders..." />;

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${C.border}`,
              background: C.surface, display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textSub, cursor: "pointer", transition: "all 120ms"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}>
            <Icon.ArrowLeft />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textMain, letterSpacing: "-0.015em" }}>My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.6 }}>📦</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>No orders yet!</h2>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 22 }}>Start exploring restaurants and place your first order</p>
            <button onClick={() => navigate("/restaurants")}
              style={{
                padding: "13px 26px", borderRadius: 16, border: "none",
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(15,61,46,0.25)"
              }}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map(order => {
              const statusStyle = STATUS_STYLE[order.status] || { color: C.textSub, bg: C.borderSoft };
              return (
                <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    cursor: "pointer", padding: 18, borderRadius: 18, background: C.surface,
                    border: `1px solid ${C.border}`, transition: "all 120ms"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + "60"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon.Package />
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.textMain }}>
                        Order #{order.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                      color: statusStyle.color, background: statusStyle.bg
                    }}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p style={{ color: C.textSub, fontSize: 13 }}>{order.restaurant?.name || "Restaurant"}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    <span style={{ color: C.textMuted, fontSize: 12 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.textMain }}>
                        ₹{order.total ?? order.subtotal}
                      </span>
                      <Icon.ChevronRight />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}