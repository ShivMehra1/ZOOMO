import { useEffect, useState } from "react";
import {
  getRestaurants,
  approveRestaurant,
  rejectRestaurant,
  toggleRestaurantActive,
} from "../services/adminApi";
import { FiSearch, FiRefreshCw, FiCheckCircle, FiXCircle, FiToggleLeft, FiToggleRight } from "react-icons/fi";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function fetchRestaurants() {
    try {
      setLoading(true);
      const res = await getRestaurants(search || undefined);
      setRestaurants(res.data);
    } catch {
      alert("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleApprove(id) {
    try {
      setBusyId(id);
      await approveRestaurant(id);
      fetchRestaurants();
    } catch {
      alert("Failed to approve restaurant");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    if (!confirm("Reject this restaurant? It will be hidden from customers.")) return;
    try {
      setBusyId(id);
      await rejectRestaurant(id);
      fetchRestaurants();
    } catch {
      alert("Failed to reject restaurant");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(id, current) {
    try {
      setBusyId(id);
      await toggleRestaurantActive(id, !current);
      fetchRestaurants();
    } catch {
      alert("Failed to update restaurant status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Restaurants</h2>
          <p className="text-z-muted text-sm mt-1">{restaurants.length} restaurants</p>
        </div>
        <button onClick={fetchRestaurants} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={15} />
        <input
          type="text"
          placeholder="Search by name or cuisine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-z-line bg-z-surface text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
        />
      </div>

      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-4 text-z-muted font-medium">Restaurant</th>
                <th className="px-6 py-4 text-z-muted font-medium">Owner</th>
                <th className="px-6 py-4 text-z-muted font-medium">Cuisine</th>
                <th className="px-6 py-4 text-z-muted font-medium">Orders</th>
                <th className="px-6 py-4 text-z-muted font-medium">Rating</th>
                <th className="px-6 py-4 text-z-muted font-medium">Approval</th>
                <th className="px-6 py-4 text-z-muted font-medium">Open</th>
                <th className="px-6 py-4 text-z-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-z-muted">Loading restaurants...</td></tr>
              )}
              {!loading && restaurants.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-z-muted">No restaurants found</td></tr>
              )}
              {!loading && restaurants.map((r) => (
                <tr key={r.id} className="border-t border-z-line-soft hover:bg-z-page transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {r.imageUrl && (
                        <img src={r.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-z-line" />
                      )}
                      <div>
                        <p className="text-z-ink font-medium">{r.name}</p>
                        <p className="text-z-muted text-xs">{r.dishCount} dishes</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-z-sub">
                    <p>{r.owner?.name}</p>
                    <p className="text-z-muted text-xs">{r.owner?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-z-sub">{r.cuisineType || "—"}</td>
                  <td className="px-6 py-4 text-z-sub">{r.orderCount}</td>
                  <td className="px-6 py-4 text-z-sub">{r.rating ? `★ ${r.rating.toFixed(1)}` : "—"}</td>
                  <td className="px-6 py-4">
                    {r.isApproved ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(r.id, r.isActive)}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {r.isActive ? (
                        <FiToggleRight className="text-z-primary" size={22} />
                      ) : (
                        <FiToggleLeft className="text-z-muted" size={22} />
                      )}
                      <span className={r.isActive ? "text-z-primary" : "text-z-muted"}>
                        {r.isActive ? "Open" : "Closed"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {r.isApproved ? (
                      <button
                        onClick={() => handleReject(r.id)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-z-danger border border-red-200 text-xs font-semibold transition disabled:opacity-50"
                      >
                        <FiXCircle size={13} /> Reject
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(r.id)}
                        disabled={busyId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-z-primary hover:bg-z-hover text-white text-xs font-semibold transition disabled:opacity-50"
                      >
                        <FiCheckCircle size={13} /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
