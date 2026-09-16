import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const C = {
  surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E",
  border: "#DCE6E0", borderSoft: "#EEF3F0",
};

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

const Icon = {
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  LogIn: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  UserPlus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Cart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const address = localStorage.getItem("ze_address");
  const cartCount = cart?.items?.reduce((t, i) => t + i.quantity, 0) ?? 0;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.93)",
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${scrolled ? C.border : C.borderSoft}`,
      boxShadow: scrolled ? "0 2px 20px rgba(15,61,46,0.07)" : "none",
      transition: "all 180ms ease-out",
      fontFamily: "'Satoshi', system-ui, sans-serif",
      overflow: "hidden", width: "100%",
    }}>
      <div style={{
        maxWidth: 1152, margin: "0 auto", padding: "10px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, boxSizing: "border-box", width: "100%"
      }}>

        <Link to="/" style={{ flexShrink: 0, textDecoration: "none" }}>
          <ZLogo />
        </Link>

        {address && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
            borderRadius: 10, background: "#F4F7F5", border: `1px solid ${C.border}`,
            fontSize: 12, color: C.textMain,
            flex: "1 1 0", minWidth: 0, maxWidth: 200, overflow: "hidden"
          }}>
            <span style={{
              color: C.accent, flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon.MapPin />
            </span>
            <span style={{
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", fontWeight: 500, minWidth: 0
            }}>
              {address}
            </span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {user ? (
            <>
              <button onClick={() => navigate("/orders")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.textMain, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 120ms", flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <Icon.User /> {user.name?.split(" ")[0]}
              </button>
              <button onClick={logout} title="Logout"
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "1.5px solid #FECACA",
                  background: "#FFF5F5", color: "#DC2626", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 120ms", flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                onMouseLeave={e => e.currentTarget.style.background = "#FFF5F5"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.surface,
                  color: C.textSub, fontSize: 13, fontWeight: 500, textDecoration: "none",
                  transition: "all 120ms", flexShrink: 0, whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
              >
                <Icon.LogIn /> Login
              </Link>
              <Link to="/signup"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 10, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                  color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(15,61,46,0.25)", transition: "all 120ms",
                  flexShrink: 0, whiteSpace: "nowrap"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.35)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,61,46,0.25)"}
              >
                <Icon.UserPlus /> Sign up
              </Link>
            </>
          )}

          <button onClick={() => navigate("/cart")}
            style={{
              position: "relative", width: 38, height: 38, borderRadius: 10,
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