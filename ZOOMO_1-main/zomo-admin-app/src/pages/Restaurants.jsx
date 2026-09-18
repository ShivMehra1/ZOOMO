import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRestaurant, getRestaurants } from "../services/adminApi";
import { RestaurantThumb } from "../lib/media";
import CreateSheet from "../components/CreateSheet";
import { FiSearch, FiRefreshCw, FiChevronRight, FiPlus } from "react-icons/fi";

export default function Restaurants() {
  const nav = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function fetchRestaurants() {
    try {
      setLoading(true);
      setError("");
      const res = await getRestaurants(search || undefined);
      const rows = Array.isArray(res.data) ? res.data : [];
      setRestaurants(rows);
      if (!Array.isArray(res.data)) setError("Unexpected response from the API.");
    } catch (err) {
      setRestaurants([]);
      setError(err?.response?.data?.message || err?.message || "Could not load restaurants.");
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
      {creating && (
        <CreateSheet
          kind="restaurant"
          title="Create restaurant"
          onClose={() => setCreating(false)}
          onSubmit={async (data) => { await createRestaurant(data); fetchRestaurants(); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Restaurants</h2>
          <p className="text-z-muted text-sm mt-1">{visible.length} Jourian restaurants</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreating(true)} className="btn-primary"><FiPlus size={14} /> Create</button>
          <button onClick={fetchRestaurants} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={15} />
        <input
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-z-line bg-z-surface text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-z-danger">
          {error}{" "}
          <button type="button" onClick={fetchRestaurants} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loading && <p className="text-z-muted text-sm py-8">Loading restaurants…</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-z-muted text-sm py-8">No restaurants yet.</p>
        )}
        {!loading && visible.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => nav(`/admin/restaurants/${r.id}`)}
            className="flex items-center gap-4 rounded-card border border-z-line bg-z-surface p-4 text-left shadow-card hover:shadow-glow transition"
          >
            <RestaurantThumb url={r.imageUrl} alt={r.name} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-z-ink truncate">{r.name}</p>
              <p className="text-xs text-z-muted mt-0.5">{r.cuisineType || "Various"} · {r.dishCount ?? 0} dishes · {r.orderCount ?? 0} orders</p>
              <p className="text-xs text-z-sub mt-0.5">{r.isApproved ? (r.isActive ? "Open" : "Closed") : "Rejected"}</p>
            </div>
            <FiChevronRight className="text-z-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
