import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRestaurants, getOrders } from "../services/adminApi";
import { displayKitchenName, enrichJourianRestaurants, isFakeKitchenName } from "../lib/real";
import { FiSearch, FiRefreshCw, FiChevronRight } from "react-icons/fi";

export default function Restaurants() {
  const nav = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchRestaurants() {
    try {
      setLoading(true);
      let orders = [];
      try {
        const o = await getOrders();
        orders = o.data || [];
      } catch {
        orders = [];
      }
      const jourian = enrichJourianRestaurants(orders);
      try {
        const res = await getRestaurants(search || undefined);
        const live = (res.data || [])
          .filter((r) => !isFakeKitchenName(r.name))
          .map((r) => ({ ...r, name: displayKitchenName(r.name) }));
        const byName = new Map(jourian.map((r) => [r.name.toLowerCase(), r]));
        for (const r of live) {
          const key = r.name.toLowerCase();
          const base = byName.get(key);
          byName.set(key, { ...(base || {}), ...r, dishCount: r.dishCount || base?.dishCount || 0 });
        }
        setRestaurants([...byName.values()]);
      } catch {
        setRestaurants(jourian);
      }
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchRestaurants, 200);
    return () => clearTimeout(t);
  }, [search]);

  const q = search.trim().toLowerCase();
  const visible = restaurants.filter((r) => !q || r.name.toLowerCase().includes(q) || String(r.cuisineType || "").toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Restaurants</h2>
          <p className="text-z-muted text-sm mt-1">{visible.length} Jourian kitchens</p>
        </div>
        <button onClick={fetchRestaurants} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={15} />
        <input
          type="text"
          placeholder="Search kitchens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-z-line bg-z-surface text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loading && <p className="text-z-muted text-sm py-8">Loading kitchens…</p>}
        {!loading && visible.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => nav(`/admin/restaurants/${r.id}`)}
            className="text-left rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden hover:shadow-glow transition"
          >
            <div className="h-36 bg-z-page overflow-hidden">
              <img src={r.imageUrl} alt="" className="size-full object-cover" />
            </div>
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">{r.cuisineType} · Jourian</p>
                <h3 className="text-lg font-bold text-z-ink truncate">{r.name}</h3>
                <p className="mt-1 text-xs text-z-sub">{r.dishCount || 0} dishes · {r.orderCount || 0} orders · ★ {(r.rating || 0).toFixed(1)}</p>
              </div>
              <FiChevronRight className="text-z-muted mt-2" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
