import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { MascotLoader } from "./LandingPage";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
};

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  ),
  Minus: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Plus: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, increaseQuantity, decreaseQuantity, removeItem, getSubtotal, restaurantConflict, confirmReplaceCart, cancelReplaceCart } = useCart();

  if (loading) return <MascotLoader text="Loading cart..." />;

  if (!cart || cart.items.length === 0) return (
    <div style={{
      minHeight: "100vh", background: C.page, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px",
      fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.6 }}>🛒</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textMain, marginBottom: 6 }}>Your cart is empty</h2>
      <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Add some delicious food to get started!</p>
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
  );

  const subtotal = parseFloat(getSubtotal().toFixed(2));
  const delivery = 29;
  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const total = parseFloat((subtotal + delivery + tax).toFixed(2));

  return (
    <div style={{
      minHeight: "100vh", background: C.page, paddingBottom: 32,
      fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px" }}>

        {/* Header */}
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textMain, letterSpacing: "-0.015em" }}>Your Cart</h1>
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {cart.items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: 14,
              borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`
            }}>
              <img src={item.dish?.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&h=160&fit=crop"}
                alt={item.dish?.name} style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontWeight: 600, fontSize: 14, color: C.textMain,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{item.dish?.name}</h3>
                <p style={{ color: C.primary, fontWeight: 700, fontSize: 14, marginTop: 3 }}>
                  ₹{item.dish?.price * item.quantity}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => decreaseQuantity(item)}
                  style={{
                    width: 28, height: 28, borderRadius: 9, background: C.page, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", color: C.textMain, cursor: "pointer"
                  }}>
                  <Icon.Minus />
                </button>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textMain, width: 16, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => increaseQuantity(item)}
                  style={{
                    width: 28, height: 28, borderRadius: 9, background: C.primary, border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer"
                  }}>
                  <Icon.Plus />
                </button>
              </div>
              <button onClick={() => removeItem(item.id)}
                style={{
                  padding: 8, background: "none", border: "none", color: C.textMuted,
                  cursor: "pointer", flexShrink: 0, transition: "color 120ms"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#DC2626"}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                <Icon.Trash />
              </button>
            </div>
          ))}
        </div>

        {/* Bill */}
        <div style={{
          padding: 20, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`,
          marginBottom: 20
        }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: C.textMain, marginBottom: 14 }}>Bill Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "Subtotal", val: `₹${subtotal}` },
              { label: "Delivery Fee", val: `₹${delivery}` },
              { label: "Tax & charges (5%)", val: `₹${tax}` },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSub }}>
                <span>{r.label}</span><span>{r.val}</span>
              </div>
            ))}
            <div style={{
              borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12, marginTop: 3,
              display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: C.textMain
            }}>
              <span>Total</span><span>₹{total}</span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate("/checkout")}
          style={{
            width: "100%", padding: "16px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
            color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(15,61,46,0.25)", transition: "box-shadow 120ms"
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,61,46,0.35)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.25)"}>
          Proceed to Checkout · ₹{total}
        </button>
      </div>

      {/* Conflict Modal */}
      {restaurantConflict && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,61,46,0.6)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: C.surface, borderRadius: 24, padding: 28, maxWidth: 380, width: "100%",
            textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textMain, marginBottom: 8 }}>Replace Cart?</h2>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 22 }}>Your cart has items from another restaurant.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancelReplaceCart}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${C.border}`,
                  background: "transparent", color: C.textSub, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}>
                Cancel
              </button>
              <button onClick={confirmReplaceCart}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, border: "none", background: C.primary,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                }}>
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}