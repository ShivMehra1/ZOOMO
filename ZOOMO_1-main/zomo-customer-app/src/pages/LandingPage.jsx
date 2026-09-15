import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

/* ─── DESIGN TOKENS ─────────────────────────────── */
const C = {
  page: "#F5F7F6",
  surface: "#FFFFFF",
  primary: "#0F3D2E",
  hover: "#145A43",
  accent: "#22C55E",
  textMain: "#0B0F0E",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderSoft: "#F0F2F1",
};

/* ─── MASCOT LOADER (keep same API as original) ─── */
export function MascotLoader({ text = "Loading..." }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999, background: "#F5F7F6",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: C.primary,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 10H22" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M22 10L10 22" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M10 22H26" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ color: C.primary, fontWeight: 600, fontSize: 14, letterSpacing: "0.02em" }}>{text}</p>
    </div>
  );
}

/* ─── ICONS ──────────────────────────────────────── */
const Icon = {
  Search: ({ size = 18, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  MapPin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Cart: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  User: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Star: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Clock: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Tag: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  LogIn: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  UserPlus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

/* ─── CUISINE TICKER REMOVED ─────────────────────── */

/* ─── ADDRESS MODAL ───────────────────────────────── */
function AddressModal({ onConfirm, onSkip }) {
  const [val, setVal] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,61,46,0.7)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        width: "100%", maxWidth: 440, background: C.surface, borderRadius: 28,
        padding: 32, boxShadow: "0 24px 80px rgba(15,61,46,0.25)", border: `1px solid ${C.borderSoft}`
      }}>

        <div style={{
          width: 52, height: 52, borderRadius: 16, background: C.primary,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
        }}>
          <Icon.MapPin size={22} />
        </div>
        <h2 style={{ color: C.textMain, fontSize: 24, fontWeight: 700, marginBottom: 6, lineHeight: "32px" }}>
          Where should we deliver?
        </h2>
        <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>
          Enter your address to find nearby restaurants
        </p>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.accent }}>
            <Icon.MapPin size={16} />
          </div>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && val.trim() && onConfirm(val.trim())}
            placeholder="e.g. Koramangala, Bengaluru"
            style={{
              width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
              borderRadius: 14, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.textMain,
              outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              transition: "border-color 120ms"
            }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>

        <button
          onClick={() => val.trim() && onConfirm(val.trim())}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10,
            fontFamily: "inherit", transition: "opacity 120ms"
          }}
          onMouseEnter={e => e.target.style.opacity = "0.9"}
          onMouseLeave={e => e.target.style.opacity = "1"}
        >
          Find Food Near Me
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%", padding: "12px", borderRadius: 14, border: `1.5px solid ${C.border}`,
            background: "transparent", color: C.textSub, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", transition: "color 120ms, border-color 120ms"
          }}
          onMouseEnter={e => { e.target.style.color = C.textMain; e.target.style.borderColor = C.textMain; }}
          onMouseLeave={e => { e.target.style.color = C.textSub; e.target.style.borderColor = C.border; }}
        >
          Set later
        </button>
      </div>
    </div>
  );
}

/* ─── SEARCH RESULT ROW (used in overlay) ───────── */
function SearchResultRow({ r, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "10px 12px",
        borderRadius: 14, cursor: "pointer",
        background: hovered ? C.page : "transparent",
        transition: "background 120ms"
      }}
    >
      <img src={r.img} alt={r.name}
        style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 14, color: C.textMain,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {r.name}
        </div>
        <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>
          {r.cuisine} · {r.eta}
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: C.primary,
        background: C.primary + "12", padding: "4px 10px", borderRadius: 8, flexShrink: 0
      }}>
        ₹{r.cost}
      </div>
    </div>
  );
}

/* ─── NAVBAR ──────────────────────────────────────── */
const LOGO_URL = "https://res.cloudinary.com/dx2qaarhy/image/upload/v1789420327/2bb606dc-2292-40ba-a4e8-df6720a3b700.png";

function ZLogo() {
  return (
    <img
      src={LOGO_URL}
      alt="Zoomo Eats"
      style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

function LandingNavbar({ address, onAddressClick, cartCount, user, onProfileOpen, navigate }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.93)",
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${scrolled ? C.border : C.borderSoft}`,
      boxShadow: scrolled ? "0 2px 20px rgba(15,61,46,0.07)" : "none",
      transition: "all 180ms ease-out",
      overflow: "hidden",
      width: "100%",
      maxWidth: "100vw",
    }}>
      <div style={{
        maxWidth: 1152, margin: "0 auto", padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", boxSizing: "border-box"
      }}>

        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => navigate("/")}>
          <ZLogo />
        </div>

        {/* Address pill */}
        <button
          onClick={onAddressClick}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
            borderRadius: 10, background: C.page, border: `1.5px solid ${C.border}`,
            fontSize: 12, color: address ? C.textMain : C.textSub, cursor: "pointer",
            fontFamily: "inherit", flex: "1 1 0", minWidth: 0, maxWidth: 220,
            transition: "border-color 120ms", textAlign: "left", overflow: "hidden"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ color: C.accent, flexShrink: 0, display: "flex" }}><Icon.MapPin /></span>
          <span style={{
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontWeight: address ? 500 : 400, flex: 1, minWidth: 0
          }}>
            {address || "Set location"}
          </span>
        </button>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {user ? (
            <button
              onClick={onProfileOpen}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface,
                color: C.textMain, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                transition: "all 120ms"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <Icon.User />
              <span style={{ display: "none" }} className="sm:inline">{user.name?.split(" ")[0]}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 120ms"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
              >
                <Icon.LogIn /> Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
                  borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 120ms", boxShadow: "0 2px 8px rgba(15,61,46,0.25)"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.35)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,61,46,0.25)"}
              >
                <Icon.UserPlus /> Sign up
              </button>
            </>
          )}

          <button
            onClick={() => navigate("/cart")}
            style={{
              position: "relative", width: 40, height: 40, borderRadius: 10,
              border: `1.5px solid ${C.border}`, background: C.surface,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textSub, cursor: "pointer", transition: "all 120ms", flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
          >
            <Icon.Cart />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6, width: 18, height: 18,
                background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff"
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── CATEGORY PILLS ─────────────────────────────── */
const CATEGORIES = ["All", "Pizza", "Burgers", "Indian", "Chinese", "Biryani", "Desserts", "Beverages", "Healthy", "Street Food"];

/* ─── RESTAURANT CARD ────────────────────────────── */
function RestaurantCard({ r, navigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => navigate(`/restaurant/${r.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface, borderRadius: 20, cursor: "pointer", overflow: "hidden",
        border: `1px solid ${hovered ? C.primary + "50" : C.border}`,
        boxShadow: hovered ? "0 12px 40px rgba(15,61,46,0.13)" : "0 2px 10px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 180ms ease-out",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 176, overflow: "hidden" }}>
        <img
          src={r.img}
          alt={r.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 240ms ease"
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)"
        }} />

        {r.coupon && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(15,61,46,0.85)", backdropFilter: "blur(4px)",
            color: C.accent, fontSize: 10, fontWeight: 600,
            padding: "4px 8px", borderRadius: 8, border: `1px solid ${C.accent}40`
          }}>
            <Icon.Tag /> {r.coupon}
          </div>
        )}

        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 11, fontWeight: 600,
          padding: "4px 8px", borderRadius: 8
        }}>
          <Icon.Star /> {r.rating}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{
          color: C.textMain, fontWeight: 700, fontSize: 15, marginBottom: 3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {r.name}
        </h3>
        <p style={{
          color: C.textSub, fontSize: 12, marginBottom: 12,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {r.cuisine}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textMuted, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon.Clock /> {r.eta}
            </span>
            <span>·</span>
            <span>₹{r.cost} for two</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 2, padding: "4px 10px",
            background: C.primary + "14", color: C.primary, fontSize: 11, fontWeight: 700,
            borderRadius: 8, letterSpacing: "0.01em"
          }}>
            Order <Icon.ChevronRight />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── RESTAURANT SKELETON ────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: C.surface, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ height: 176, background: "#F0F2F1", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          animation: "shimmer 1.4s infinite"
        }} />
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ height: 16, width: "70%", background: "#F0F2F1", borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 12, width: "50%", background: "#F0F2F1", borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ─── PROFILE DRAWER ────────────────────────────── */
function ProfileDrawer({ user, onClose, navigate }) {
  const { logout } = useAuth();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: "rgba(15,61,46,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      {/* Panel */}
      <div style={{
        width: "100%", maxWidth: 320, background: C.surface,
        borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)"
      }}>

        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C.borderSoft}`,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontWeight: 700, color: C.textMain, fontSize: 16 }}>Your profile</span>
          <button onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
              background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.textSub
            }}>
            <Icon.X size={14} />
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          {/* Avatar card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 16,
            borderRadius: 16, background: C.page, border: `1px solid ${C.borderSoft}`, marginBottom: 16
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600, color: C.textMain, fontSize: 15,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {user?.name}
              </div>
              <div style={{
                color: C.textSub, fontSize: 12, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {user?.email}
              </div>
            </div>
          </div>

          {[{ label: "My Orders", path: "/orders" }, { label: "My Cart", path: "/cart" },
          { label: "All Restaurants", path: "/restaurants" }].map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose(); }}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.textMain, fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "inherit", marginBottom: 8, transition: "all 120ms"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.page; e.currentTarget.style.borderColor = C.primary + "60"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
            >
              {item.label} <Icon.ChevronRight />
            </button>
          ))}

          <button
            onClick={() => { logout(); onClose(); }}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12, marginTop: 8,
              border: `1px solid #FECACA`, background: "#FFF5F5",
              color: "#DC2626", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 120ms"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
            onMouseLeave={e => e.currentTarget.style.background = "#FFF5F5"}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CHAT WIDGET ────────────────────────────────── */
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hey! I'm Zoomo 👋 What can I help you with?" }
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, typing]);

  function send(msg = text) {
    const val = msg.trim();
    if (!val) return;
    setMessages(m => [...m, { role: "user", text: val }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      const s = val.toLowerCase();
      let reply = "Hmm, I didn't get that! Try asking about deals, orders, or restaurants.";
      if (s.includes("deal") || s.includes("offer")) reply = "🔥 Use ZOOMO50 for 50% off, BOGO for Buy 1 Get 1, or FREESHIP for free delivery above ₹199!";
      else if (s.includes("track") || s.includes("order")) reply = "Go to My Orders to track your delivery in real-time!";
      else if (s.includes("deliver")) reply = "We deliver to 45+ cities! Set your location on the home screen.";
      else if (s.includes("pay")) reply = "We support UPI, Cards, Wallets, Net Banking & Cash on Delivery!";
      setMessages(m => [...m, { role: "bot", text: reply }]);
      setTyping(false);
    }, 1000 + Math.random() * 600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 50,
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 4px 20px rgba(15,61,46,0.35)",
          transition: "transform 120ms"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Chat with Zoomo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 50, width: 320,
      borderRadius: 24, overflow: "hidden", background: C.surface,
      border: `1px solid ${C.border}`, boxShadow: "0 16px 60px rgba(0,0,0,0.15)"
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: C.primary
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Zoomo Assist</span>
          <div style={{ width: 7, height: 7, background: C.accent, borderRadius: "50%" }} />
        </div>
        <button onClick={() => setOpen(false)}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.7)",
            cursor: "pointer", padding: 4, display: "flex", alignItems: "center"
          }}>
          <Icon.X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div ref={ref} style={{
        height: 220, overflowY: "auto", padding: 12, display: "flex",
        flexDirection: "column", gap: 8, background: C.page
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: "18px",
              background: m.role === "user" ? C.primary : C.surface,
              color: m.role === "user" ? "#fff" : C.textMain,
              border: m.role === "user" ? "none" : `1px solid ${C.border}`,
              borderBottomRightRadius: m.role === "user" ? 4 : 14,
              borderBottomLeftRadius: m.role === "bot" ? 4 : 14,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 4, paddingLeft: 4 }}>
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} style={{
                width: 7, height: 7, background: C.textMuted, borderRadius: "50%",
                animation: "bounce 0.8s ease-in-out infinite", animationDelay: `${d}s`
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div style={{
        display: "flex", gap: 6, padding: "8px 12px 0", background: C.surface,
        borderTop: `1px solid ${C.borderSoft}`
      }}>
        {["Deals 🔥", "Track order", "Payment"].map(q => (
          <button key={q} onClick={() => send(q)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 20,
              border: `1px solid ${C.border}`, background: C.page,
              color: C.textSub, cursor: "pointer", fontFamily: "inherit",
              transition: "all 120ms", whiteSpace: "nowrap"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
          >{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: 12, background: C.surface }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask something..."
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`,
            fontSize: 13, color: C.textMain, outline: "none", fontFamily: "inherit",
            transition: "border-color 120ms"
          }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button onClick={() => send()}
          style={{
            width: 38, height: 38, borderRadius: 10, border: "none",
            background: C.primary, color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 120ms"
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.hover}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <Icon.Send />
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN LANDING PAGE ──────────────────────────── */
export default function LandingPage() {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState(() => localStorage.getItem("ze_address") || "");
  const [showAddressModal, setShowAddressModal] = useState(!localStorage.getItem("ze_address") && !user);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const restaurantSectionRef = useRef(null);

  /* Load restaurants */
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/restaurants");
        // Guard: api.js returns parsed JSON directly (not axios {data:...})
        // If the response isn't an array (e.g. backend error / empty body
        // returned as {}), fall back gracefully instead of crashing.
        const list = Array.isArray(res) ? res : [];
        if (!Array.isArray(res)) {
          console.warn("⚠️ /restaurants did not return an array:", res);
        }
        const mapped = list.map(r => ({
          id: r.id,
          name: r.name,
          img: r.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
          cuisine: r.cuisineType || "Various",
          area: r.address || "Nearby",
          rating: typeof r.rating === "number" ? r.rating.toFixed(1) : "4.3",
          eta: "25-40 min",
          cost: 250,
          coupon: r.coupon || null,
        }));
        setRestaurants(mapped);
        setFiltered(mapped);
      } catch (err) {
        console.error("❌ Failed to load restaurants:", err);
        setRestaurants([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Filter */
  useEffect(() => {
    let list = restaurants;
    if (category !== "All") list = list.filter(r => r.cuisine?.toLowerCase().includes(category.toLowerCase()) || r.name?.toLowerCase().includes(category.toLowerCase()));
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q)); }
    setFiltered(list);
  }, [query, category, restaurants]);

  function handleAddressConfirm(addr) {
    setAddress(addr);
    localStorage.setItem("ze_address", addr);
    setShowAddressModal(false);
  }

  const cartCount = cart?.items?.reduce((t, i) => t + i.quantity, 0) ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.page} !important; overflow-x: hidden; }
        html { overflow-x: hidden; }
        html.dark body { background: ${C.page} !important; overflow-x: hidden; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease-out both; }
        input::placeholder { color: #9CA3AF; }
      `}</style>

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal onConfirm={handleAddressConfirm} onSkip={() => setShowAddressModal(false)} />
      )}

      {/* Navbar */}
      <LandingNavbar
        address={address}
        onAddressClick={() => setShowAddressModal(true)}
        cartCount={cartCount}
        user={user}
        onProfileOpen={() => setProfileOpen(true)}
        navigate={navigate}
      />

      {/* ── HERO WITH VIDEO BACKGROUND ── */}
      <section style={{
        position: "relative", overflow: "hidden", minHeight: 480,
        display: "flex", alignItems: "center"
      }}>

        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0
          }}
        >
          <source src="https://res.cloudinary.com/dx2qaarhy/video/upload/v1789214802/5899705-uhd_2160_4096_30fps_1.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay so text stays readable over any video */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(135deg, rgba(15,61,46,0.82) 0%, rgba(20,90,67,0.72) 100%)"
        }} />

        {/* Content */}
        <div style={{
          maxWidth: 1152, margin: "0 auto", padding: "72px 20px",
          position: "relative", zIndex: 2, width: "100%"
        }}>
          <div className="fade-up" style={{ maxWidth: 600 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.20)", borderRadius: 999,
              padding: "5px 14px", marginBottom: 20
            }}>
              <span style={{ width: 7, height: 7, background: C.accent, borderRadius: "50%" }} />
              <span style={{ color: "rgba(255,255,255,0.90)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>
                FAST DELIVERY · 45+ CITIES
              </span>
            </div>

            <h1 style={{
              color: "#fff", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700,
              lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 14,
              textShadow: "0 2px 16px rgba(0,0,0,0.3)"
            }}>
              What are you{" "}
              <span style={{ color: C.accent }}>craving</span>{" "}today?
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.80)", fontSize: 16, lineHeight: "24px",
              marginBottom: 32, maxWidth: 480, textShadow: "0 1px 8px rgba(0,0,0,0.3)"
            }}>
              {address ? `Delivering to ${address}` : "Set your location to see restaurants near you"}
            </p>

            {/* Search — clicking opens the full overlay */}
            <div style={{ position: "relative", maxWidth: 520 }}>
              <div style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                color: C.textMuted, pointerEvents: "none"
              }}>
                <Icon.Search />
              </div>
              <input
                ref={searchRef}
                readOnly
                onClick={() => setSearchOpen(true)}
                placeholder="Search restaurants, cuisines, dishes..."
                style={{
                  width: "100%", height: 54, paddingLeft: 50, paddingRight: 16,
                  borderRadius: 16, border: "2px solid transparent", background: "rgba(255,255,255,0.97)",
                  fontSize: 15, color: C.textMain, outline: "none", fontFamily: "inherit",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)", cursor: "pointer"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── OFFER BANNER ── */}
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px" }}>
        <div style={{
          marginTop: 24, position: "relative", zIndex: 10,
          background: C.surface, borderRadius: 20, padding: "18px 24px",
          boxShadow: "0 4px 24px rgba(15,61,46,0.10)", border: `1px solid ${C.borderSoft}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.accent, marginBottom: 3 }}>
              LIMITED TIME OFFER
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.textMain }}>
              Free delivery on your first 3 orders. No code needed.
            </div>
          </div>
          <button
            onClick={() => {
              if (user) {
                // Already logged in — smooth scroll down to restaurant grid
                restaurantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                // Not logged in — go to login
                navigate("/login");
              }
            }}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
              color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
              transition: "box-shadow 120ms", boxShadow: "0 2px 10px rgba(15,61,46,0.25)"
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.35)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(15,61,46,0.25)"}
          >
            Order now
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Category pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textMain, letterSpacing: "-0.01em" }}>
            Explore by cuisine
          </h2>
        </div>
        <div className="no-scrollbar" style={{
          display: "flex", gap: 8, overflowX: "auto",
          paddingBottom: 4, marginBottom: 32
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0, padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                border: `1.5px solid ${category === cat ? C.primary : C.border}`,
                background: category === cat ? C.primary : C.surface,
                color: category === cat ? "#fff" : C.textSub,
                boxShadow: category === cat ? "0 4px 14px rgba(15,61,46,0.22)" : "none",
                transition: "all 120ms ease-out",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section heading — scroll target for "Order now" button */}
        <div ref={restaurantSectionRef} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textMain, letterSpacing: "-0.01em" }}>
            {query ? `Results for "${query}"` : address ? `Near ${address}` : "Restaurants near you"}
          </h2>
          {!loading && (
            <span style={{ fontSize: 13, color: C.textMuted }}>
              {filtered.length} available
            </span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "72px 20px", textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>Nothing found</h3>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 20 }}>
              Try a different search or pick another category
            </p>
            <button
              onClick={() => { setQuery(""); setCategory("All"); }}
              style={{
                padding: "10px 22px", borderRadius: 12, border: `1.5px solid ${C.primary}`,
                background: "transparent", color: C.primary, fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", transition: "all 120ms"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.primary; }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtered.map(r => <RestaurantCard key={r.id} r={r} navigate={navigate} />)}
          </div>
        )}

        {/* Why section */}
        <div style={{ marginTop: 72, paddingTop: 48, borderTop: `1px solid ${C.borderSoft}` }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.accent, marginBottom: 8 }}>
              WHY ZOOMO EATS
            </div>
            <h2 style={{
              fontSize: 30, fontWeight: 700, color: C.textMain, letterSpacing: "-0.02em",
              lineHeight: "38px"
            }}>
              Faster food. Simpler checkout.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { emoji: "⚡", title: "Under 60 seconds", desc: "Orders confirmed and dispatched before you've put your phone down." },
              { emoji: "📍", title: "Real-time tracking", desc: "Watch every step of your delivery on a live map." },
              { emoji: "✅", title: "Quality vetted", desc: "Every restaurant passes our hygiene and rating standards before listing." },
            ].map(f => (
              <div key={f.title}
                style={{
                  padding: 24, borderRadius: 20, background: C.surface,
                  border: `1px solid ${C.borderSoft}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: C.textSub, lineHeight: "20px" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.primary, padding: "48px 20px 28px", marginTop: 0 }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 32, marginBottom: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                    <path d="M6 10H22" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M22 10L10 22" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M10 22H26" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  Zoomo <span style={{ color: C.accent }}>Eats</span>
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: "20px", maxWidth: 220 }}>
                Fastest food delivery with real-time tracking & great offers.
              </p>
            </div>
            {[
              { title: "Explore", links: [["Restaurants", "/restaurants"], ["Offers", "#"], ["Support", "#"]] },
              { title: "Legal", links: [["Terms & Conditions", "#"], ["Privacy Policy", "#"], ["Cookie Policy", "#"]] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 14, letterSpacing: "0.02em" }}>{col.title}</h4>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} style={{
                        color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none",
                        transition: "color 120ms"
                      }}
                        onMouseEnter={e => e.target.style.color = "#fff"}
                        onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                      >{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 20,
            color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center"
          }}>
            © {new Date().getFullYear()} Zoomo Eats. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── FULL SCREEN SEARCH OVERLAY ── */}
      {searchOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column",
          background: "rgba(11,15,14,0.55)", backdropFilter: "blur(6px)"
        }}
          onClick={e => { if (e.target === e.currentTarget) { setSearchOpen(false); setQuery(""); } }}
        >
          <div style={{
            background: C.surface, width: "100%", maxHeight: "90vh",
            borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
            overflow: "hidden"
          }}>

            {/* Search input row */}
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.borderSoft}`,
              display: "flex", alignItems: "center", gap: 12
            }}>
              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                <Icon.Search size={18} style={{ position: "absolute", left: 14, color: C.textMuted, pointerEvents: "none" }} />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search restaurants, cuisines, dishes..."
                  style={{
                    width: "100%", height: 48, paddingLeft: 44, paddingRight: 16,
                    borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.page,
                    fontSize: 15, color: C.textMain, outline: "none", fontFamily: "inherit",
                    transition: "border-color 120ms"
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <button onClick={() => { setSearchOpen(false); setQuery(""); }}
                style={{
                  padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`,
                  background: "transparent", color: C.textSub, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap"
                }}>
                Cancel
              </button>
            </div>

            {/* Results */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {!query.trim() ? (
                /* Empty state — show all restaurants */
                <div style={{ padding: "16px 20px" }}>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: C.textMuted,
                    letterSpacing: "0.08em", marginBottom: 12
                  }}>ALL RESTAURANTS</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {restaurants.map(r => (
                      <SearchResultRow key={r.id} r={r} onSelect={() => {
                        setSearchOpen(false); setQuery(""); navigate(`/restaurant/${r.id}`);
                      }} />
                    ))}
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.textMain, marginBottom: 6 }}>
                    No results for "{query}"
                  </p>
                  <p style={{ fontSize: 13, color: C.textSub }}>Try a different name or cuisine</p>
                </div>
              ) : (
                <div style={{ padding: "16px 20px" }}>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: C.textMuted,
                    letterSpacing: "0.08em", marginBottom: 12
                  }}>
                    {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""} FOR "{query.toUpperCase()}"
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {filtered.map(r => (
                      <SearchResultRow key={r.id} r={r} onSelect={() => {
                        setSearchOpen(false); setQuery(""); navigate(`/restaurant/${r.id}`);
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {profileOpen && <ProfileDrawer user={user} onClose={() => setProfileOpen(false)} navigate={navigate} />}

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}