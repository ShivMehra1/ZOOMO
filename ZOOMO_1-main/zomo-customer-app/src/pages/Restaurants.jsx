import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { MascotLoader } from "./LandingPage";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39", accent: "#1F7A52",
  textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E", border: "#DCE6E0", borderSoft: "#EEF3F0",
};

const CATEGORIES = ["All", "Pizza", "Burgers", "Indian", "Chinese", "Biryani", "Desserts", "Beverages", "Healthy"];

const Icon = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  X: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
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
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
};

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
      <div style={{ position: "relative", height: 176, overflow: "hidden" }}>
        <img src={r.img} alt={r.name} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 240ms ease"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)"
        }} />
        {r.coupon && (
          <div style={{
            position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 4,
            background: "rgba(15,61,46,0.85)", backdropFilter: "blur(4px)", color: C.accent, fontSize: 10,
            fontWeight: 600, padding: "4px 8px", borderRadius: 8, border: `1px solid ${C.accent}40`
          }}>
            <Icon.Tag /> {r.coupon}
          </div>
        )}
        <div style={{
          position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 11,
          fontWeight: 600, padding: "4px 8px", borderRadius: 8
        }}>
          <Icon.Star /> {r.rating}
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{
          color: C.textMain, fontWeight: 700, fontSize: 15, marginBottom: 3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>{r.name}</h3>
        <p style={{
          color: C.textSub, fontSize: 12, marginBottom: 12,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>{r.cuisine}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.textMuted, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Clock /> {r.eta}</span>
            <span>·</span>
            <span>₹{r.cost} for two</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 2, padding: "4px 10px",
            background: C.primary + "14", color: C.primary, fontSize: 11, fontWeight: 700, borderRadius: 8
          }}>
            Order <Icon.ChevronRight />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Restaurants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/restaurants");
        const mapped = res.map(r => ({
          id: r.id, name: r.name,
          img: r.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
          cuisine: r.cuisineType || "Various",
          rating: r.rating?.toFixed(1) ?? "4.3", eta: "25-40 min", cost: 250, coupon: r.coupon || null,
        }));
        setRestaurants(mapped); setFiltered(mapped);
      } catch {
        setRestaurants([]); setFiltered([]);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    let list = restaurants;
    if (category !== "All") list = list.filter(r => r.cuisine?.toLowerCase().includes(category.toLowerCase()) || r.name?.toLowerCase().includes(category.toLowerCase()));
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q)); }
    setFiltered(list);
  }, [query, category, restaurants]);

  if (loading) return <MascotLoader text="Finding restaurants near you..." />;

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
        input::placeholder { color: #8A938E; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 20px 60px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.textMain, letterSpacing: "-0.015em", marginBottom: 20 }}>
          Restaurants near you
        </h1>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 480, marginBottom: 20 }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>
            <Icon.Search />
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            style={{
              width: "100%", height: 48, paddingLeft: 46, paddingRight: query ? 40 : 16,
              borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.surface,
              fontSize: 14, color: C.textMain, outline: "none", fontFamily: "inherit",
              transition: "border-color 120ms"
            }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          {query && (
            <button onClick={() => setQuery("")}
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex"
              }}>
              <Icon.X />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0, padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                border: `1.5px solid ${category === cat ? C.primary : C.border}`,
                background: category === cat ? C.primary : C.surface,
                color: category === cat ? "#fff" : C.textSub,
                boxShadow: category === cat ? "0 4px 14px rgba(15,61,46,0.22)" : "none",
                transition: "all 120ms ease-out"
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <p style={{ color: C.textMain, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No restaurants found</p>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 20 }}>Try a different search or category</p>
            <button onClick={() => { setQuery(""); setCategory("All"); }}
              style={{
                padding: "10px 22px", borderRadius: 12, border: `1.5px solid ${C.primary}`,
                background: "transparent", color: C.primary, fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", transition: "all 120ms"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.primary; }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>{filtered.length} restaurants found</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {filtered.map(r => <RestaurantCard key={r.id} r={r} navigate={navigate} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}