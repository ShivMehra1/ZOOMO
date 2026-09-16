import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", textMain: "#0C1612",
  textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0",
};

const Icon = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
  ),
};

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/restaurants").then(res => setRestaurants(Array.isArray(res) ? res : [])).catch(() => setRestaurants([]));
  }, []);

  const query = q.trim().toLowerCase();

  const matchingRestaurants = useMemo(() => {
    if (!query) return restaurants;
    return restaurants.filter(r =>
      r.name?.toLowerCase().includes(query) ||
      r.cuisineType?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query)
    );
  }, [query, restaurants]);

  useEffect(() => {
    if (!query) { setDishes([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.get(`/dishes/search?q=${encodeURIComponent(query)}`)
        .then(res => setDishes(Array.isArray(res) ? res : []))
        .catch(() => setDishes([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <style>{`@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface,
              display: "flex", alignItems: "center", justifyContent: "center", color: C.textSub, cursor: "pointer"
            }}>
            <Icon.ArrowLeft />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.textMain }}>Search</h1>
        </div>

        <div style={{ position: "relative", marginBottom: 28 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>
            <Icon.Search />
          </span>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Restaurants, dishes, cuisines"
            style={{
              width: "100%", height: 48, borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.surface,
              paddingLeft: 44, paddingRight: 16, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
            }} />
        </div>

        {query && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.textMain, marginBottom: 10 }}>Dishes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {loading && <p style={{ fontSize: 13, color: C.textMuted }}>Searching…</p>}
              {!loading && dishes.length === 0 && <p style={{ fontSize: 13, color: C.textMuted }}>No dishes found</p>}
              {dishes.map(d => (
                <button key={d.id} onClick={() => navigate(`/restaurant/${d.restaurantId}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, borderRadius: 14, background: C.surface,
                    border: `1px solid ${C.border}`, padding: 10, textAlign: "left", cursor: "pointer"
                  }}>
                  <img src={d.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"} alt=""
                    style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.restaurant?.name}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>₹{d.price}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.textMain, marginBottom: 10 }}>Restaurants</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {matchingRestaurants.map(r => (
            <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 12, borderRadius: 16, background: C.surface,
                border: `1px solid ${C.border}`, padding: 12, textAlign: "left", cursor: "pointer"
              }}>
              <img src={r.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"} alt=""
                style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                <p style={{ fontSize: 12, color: C.textMuted }}>{r.cuisineType || "Various"}</p>
              </div>
            </button>
          ))}
          {matchingRestaurants.length === 0 && (
            <p style={{ fontSize: 13, color: C.textMuted }}>No restaurants found</p>
          )}
        </div>
      </div>
    </div>
  );
}
