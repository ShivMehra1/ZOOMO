import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getFavorites, getVegOnly, setVegOnly } from "../utils/prefs";
import { MascotLoader } from "./LandingPage";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
  danger: "#B42318", sage: "#D7E6DE",
};

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
  ),
  MapPin: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
  Pencil: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  Heart: ({ filled }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? C.primary : "none"} stroke={C.primary} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
};

function Section({ title, action, children }) {
  return (
    <section style={{ marginBottom: 16, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.textMain }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const [vegOnly, setVegOnlyState] = useState(getVegOnly());

  const [addresses, setAddresses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });

  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    async function load() {
      try {
        const [addr, rests, ords] = await Promise.all([
          api.get("/addresses"),
          api.get("/restaurants"),
          api.get("/orders/mine"),
        ]);
        setAddresses(Array.isArray(addr) ? addr : []);
        setRestaurants(Array.isArray(rests) ? rests : []);
        setOrders(Array.isArray(ords) ? ords : []);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const favoriteIds = getFavorites();
  const savedRestaurants = restaurants.filter(r => favoriteIds.includes(r.id));

  const regulars = useMemo(() => {
    const counts = {};
    for (const o of orders) counts[o.restaurantId] = (counts[o.restaurantId] || 0) + 1;
    return Object.entries(counts)
      .map(([restaurantId, count]) => ({ restaurant: restaurants.find(r => r.id === restaurantId), count }))
      .filter(r => r.restaurant)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, restaurants]);

  const recentOrders = orders.slice(0, 5);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  async function saveDetails() {
    try {
      await updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      flash();
    } catch {
      alert("Could not save your details");
    }
  }

  function toggleVeg() {
    const next = !vegOnly;
    setVegOnlyState(next);
    setVegOnly(next);
  }


  async function submitAddress() {
    if (!form.street || !form.city || !form.state || !form.zipCode) return alert("Fill the full address");
    try {
      if (editId) {
        const updated = await api.patch(`/addresses/${editId}`, form);
        setAddresses(prev => prev.map(a => a.id === editId ? updated : a));
      } else {
        const created = await api.post("/addresses", form);
        setAddresses(prev => [...prev, created]);
      }
      setAdding(false);
      setEditId(null);
      setForm({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });
      flash();
    } catch {
      alert("Could not save address");
    }
  }

  async function removeAddress(id) {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {
      alert("Could not remove address");
    }
  }

  if (!user) return null;
  if (loading) return <MascotLoader text="Loading your profile..." />;

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <button onClick={() => navigate(-1)}
            style={{
              width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface,
              display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, cursor: "pointer"
            }}>
            <Icon.ArrowLeft />
          </button>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.accent, textTransform: "uppercase" }}>Account</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textMain, letterSpacing: "-0.01em" }}>Your profile</h1>
          </div>
        </div>

        {/* Details */}
        <Section title="Details" action={savedFlash && <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>Saved</span>}>
          {["name", "email", "phone"].map(field => (
            <label key={field} style={{ display: "block", marginBottom: 12, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "capitalize" }}>
              {field}
              <input
                value={field === "name" ? name : field === "email" ? email : phone}
                onChange={e => (field === "name" ? setName : field === "email" ? setEmail : setPhone)(e.target.value)}
                style={{
                  display: "block", marginTop: 4, width: "100%", height: 44, borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: C.page, padding: "0 14px", fontSize: 13,
                  color: C.textMain, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
                }} />
            </label>
          ))}
          <button onClick={saveDetails}
            style={{ width: "100%", height: 44, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Save details
          </button>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 14, background: C.page, padding: "12px 16px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain }}>Veg only</span>
            <button onClick={toggleVeg}
              style={{ position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", background: vegOnly ? C.primary : C.borderSoft, cursor: "pointer" }}>
              <span style={{ position: "absolute", top: 2, left: vegOnly ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 150ms" }} />
            </button>
          </div>
        </Section>

        {/* Addresses */}
        <Section title="Addresses" action={
          <button onClick={() => { setAdding(true); setEditId(null); setForm({ street: "", city: "Jourian", state: "Jammu", zipCode: "" }); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Icon.Plus /> Add
          </button>
        }>
          {addresses.map(a => (
            <div key={a.id} style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 14, border: `1px solid ${C.border}`, padding: 12 }}>
              <span style={{ marginTop: 2, color: C.accent }}><Icon.MapPin /></span>
              <p style={{ flex: 1, minWidth: 0, fontSize: 13, color: C.textMain }}>{a.street}, {a.city}, {a.state} {a.zipCode}</p>
              <button onClick={() => { setEditId(a.id); setForm({ street: a.street, city: a.city, state: a.state, zipCode: a.zipCode }); setAdding(true); }}
                style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer" }}><Icon.Pencil /></button>
              <button onClick={() => removeAddress(a.id)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer" }}><Icon.Trash /></button>
            </div>
          ))}
          {adding && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {["street", "city", "state", "zipCode"].map(k => (
                <input key={k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                  placeholder={k === "zipCode" ? "PIN" : k[0].toUpperCase() + k.slice(1)}
                  style={{ height: 42, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "0 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={submitAddress} style={{ borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", cursor: "pointer" }}>
                  {editId ? "Update" : "Save"}
                </button>
                <button onClick={() => { setAdding(false); setEditId(null); }} style={{ background: "none", border: "none", color: C.textSub, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Your restaurants */}
        <Section title="Your restaurants">
          {regulars.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textSub }}>No orders yet. Order once and the restaurant shows up here.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {regulars.map(({ restaurant, count }) => (
                <button key={restaurant.id} onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, background: C.page, border: "none", padding: 12, textAlign: "left", cursor: "pointer" }}>
                  <img src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"} alt=""
                    style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</p>
                    <p style={{ fontSize: 11, color: C.textMuted }}>{count >= 5 ? "Regular" : `${count}/5 to a free ride`}</p>
                    <div style={{ marginTop: 4, display: "flex", gap: 3 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < count ? C.primary : C.border }} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Saved restaurants */}
        <Section title="Saved restaurants">
          {savedRestaurants.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textSub }}>Tap the heart on a restaurant to save it here.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedRestaurants.map(r => (
                <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 14, background: C.page, border: "none", padding: 12, textAlign: "left", cursor: "pointer" }}>
                  <Icon.Heart filled />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain }}>{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Recent orders */}
        <Section title="Recent orders">
          {recentOrders.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textSub }}>Nothing yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentOrders.map(o => (
                <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 14, background: C.page, border: "none", padding: 12, textAlign: "left", cursor: "pointer" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.textMain }}>{o.restaurant?.name}</p>
                    <p style={{ fontSize: 11, color: C.textMuted }}>{o.status.replace(/_/g, " ")}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textMain }}>₹{o.total}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        <button onClick={() => { logout(); navigate("/"); }}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.border}`,
            background: "transparent", color: C.danger, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>
          Log out
        </button>
      </div>
    </div>
  );
}
