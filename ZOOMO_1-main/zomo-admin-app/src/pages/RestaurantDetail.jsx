import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRestaurantById,
  updateRestaurant,
  toggleRestaurantActive,
  approveRestaurant,
  rejectRestaurant,
  updateDish,
  deleteDish,
  getOrders,
  deleteOrder,
} from "../services/adminApi";
import catalog from "../data/jourian-catalog.json";
import { displayKitchenName, realOrders } from "../lib/real";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiToggleLeft,
  FiToggleRight,
  FiRefreshCw,
} from "react-icons/fi";

const STATUS_COLORS = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  READY_FOR_PICKUP: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 border-orange-200",
  DELIVERED: "bg-z-sage text-z-primary border-z-accent/20",
  CANCELLED: "bg-red-50 text-z-danger border-red-200",
};

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description", textarea: true },
  { key: "cuisineType", label: "Cuisine" },
  { key: "priceRange", label: "Price range" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "costForTwo", label: "Cost for two", number: true },
  { key: "etaMin", label: "ETA (min)", number: true },
];

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-card border border-z-line bg-z-surface p-4 shadow-card">
      <p className="text-z-muted text-xs font-medium">{label}</p>
      <p className="text-z-ink text-xl font-bold mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-z-muted text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [form, setForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [dishForm, setDishForm] = useState({});
  const [busy, setBusy] = useState(null);

  async function load() {
    try {
      setLoading(true);
      let restaurant = null;
      try {
        restaurant = (await getRestaurantById(id)).data;
      } catch {
        const k = catalog.restaurants.find((r) => r.id === id);
        if (!k) throw new Error("missing");
        restaurant = { ...k, dishes: catalog.dishes.filter((d) => d.restaurantId === id), isApproved: true, isActive: true };
      }
      restaurant = { ...restaurant, name: displayKitchenName(restaurant.name) };
      let orders = [];
      try {
        orders = realOrders((await getOrders()).data).filter(
          (o) => o.restaurantId === id || displayKitchenName(o.restaurant?.name) === restaurant.name,
        );
      } catch {}
      setRestaurant(restaurant);
      setOrders(orders);
    } catch {
      alert("Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEditInfo() {
    setForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      cuisineType: restaurant.cuisineType || "",
      priceRange: restaurant.priceRange || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      costForTwo: restaurant.costForTwo ?? "",
      etaMin: restaurant.etaMin ?? "",
    });
    setEditingInfo(true);
  }

  async function saveInfo() {
    try {
      setSavingInfo(true);
      const payload = { ...form };
      if (payload.costForTwo !== "") payload.costForTwo = Number(payload.costForTwo);
      if (payload.etaMin !== "") payload.etaMin = Number(payload.etaMin);
      await updateRestaurant(id, payload);
      setEditingInfo(false);
      await load();
    } catch {
      alert("Failed to save changes");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleToggleActive() {
    try {
      setBusy("active");
      await toggleRestaurantActive(id, !restaurant.isActive);
      await load();
    } catch {
      alert("Failed to update status");
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    try {
      setBusy("approve");
      await approveRestaurant(id);
      await load();
    } catch {
      alert("Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!confirm("Reject this restaurant? It will be hidden from customers.")) return;
    try {
      setBusy("approve");
      await rejectRestaurant(id);
      await load();
    } catch {
      alert("Failed to reject");
    } finally {
      setBusy(null);
    }
  }

  function startEditDish(dish) {
    setEditingDishId(dish.id);
    setDishForm({ name: dish.name, price: dish.price, isAvailable: dish.isAvailable });
  }

  async function saveDish(dishId) {
    try {
      setBusy(`dish-${dishId}`);
      await updateDish(id, dishId, { ...dishForm, price: Number(dishForm.price) });
      setEditingDishId(null);
      await load();
    } catch {
      alert("Failed to save dish");
    } finally {
      setBusy(null);
    }
  }

  async function removeDish(dishId) {
    if (!confirm("Delete this dish? This can't be undone.")) return;
    try {
      setBusy(`dish-${dishId}`);
      await deleteDish(id, dishId);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete dish");
    } finally {
      setBusy(null);
    }
  }

  async function removeOrder(orderId) {
    if (!confirm("Permanently delete this order? This can't be undone.")) return;
    try {
      setBusy(`order-${orderId}`);
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete order");
    } finally {
      setBusy(null);
    }
  }

  if (loading && !restaurant) {
    return <div className="px-6 py-16 text-center text-z-muted">Loading restaurant...</div>;
  }
  if (!restaurant) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav("/admin/restaurants")}
          className="flex size-9 items-center justify-center rounded-full border border-z-line bg-z-surface text-z-sub hover:text-z-primary transition"
          aria-label="Back to restaurants"
        >
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          {restaurant.imageUrl && (
            <img src={restaurant.imageUrl} alt="" className="size-12 rounded-xl object-cover border border-z-line" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-z-ink">{restaurant.name}</h2>
            <p className="text-z-muted text-sm">{restaurant.owner?.name} · {restaurant.owner?.email}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {restaurant.isApproved ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Approved</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">Rejected</span>
        )}
        <button
          onClick={handleToggleActive}
          disabled={busy === "active"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-z-line bg-z-surface disabled:opacity-50"
        >
          {restaurant.isActive ? <FiToggleRight className="text-z-primary" size={16} /> : <FiToggleLeft className="text-z-muted" size={16} />}
          {restaurant.isActive ? "Open" : "Closed"}
        </button>
        {restaurant.isApproved ? (
          <button onClick={handleReject} disabled={busy === "approve"} className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-z-danger border border-red-200 text-xs font-semibold transition disabled:opacity-50">
            Reject restaurant
          </button>
        ) : (
          <button onClick={handleApprove} disabled={busy === "approve"} className="px-3 py-1.5 rounded-full bg-z-primary hover:bg-z-hover text-white text-xs font-semibold transition disabled:opacity-50">
            Approve restaurant
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total revenue" value={`₹${restaurant.totalRevenue.toFixed(0)}`} sub={`${restaurant.totalOrders} orders`} />
        <StatCard label="Restaurant earning" value={`₹${restaurant.totalRestaurantEarning.toFixed(0)}`} sub="70% of items" />
        <StatCard label="Platform fee" value={`₹${restaurant.totalPlatformFee.toFixed(0)}`} sub="25% of items" />
        <StatCard label="Driver commission" value={`₹${restaurant.totalDriverCommission.toFixed(0)}`} sub="5% of items" />
      </div>

      {/* Info card */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-z-ink font-semibold">Details</h3>
          {!editingInfo ? (
            <button onClick={startEditInfo} className="flex items-center gap-1.5 text-xs font-semibold text-z-primary">
              <FiEdit2 size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={saveInfo} disabled={savingInfo} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-z-primary text-white text-xs font-semibold disabled:opacity-50">
                <FiCheck size={13} /> Save
              </button>
              <button onClick={() => setEditingInfo(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-z-page text-z-sub text-xs font-semibold">
                <FiX size={13} /> Cancel
              </button>
            </div>
          )}
        </div>
        {!editingInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <p className="text-z-muted text-xs">{f.label}</p>
                <p className="text-z-ink mt-0.5">{restaurant[f.key] || "—"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.textarea ? "col-span-2 md:col-span-4" : ""}>
                <span className="block text-z-muted text-xs mb-1">{f.label}</span>
                {f.textarea ? (
                  <textarea
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-xl border border-z-line bg-z-page px-3 py-2 text-sm text-z-ink"
                    rows={2}
                  />
                ) : (
                  <input
                    type={f.number ? "number" : "text"}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-xl border border-z-line bg-z-page px-3 py-2 text-sm text-z-ink"
                  />
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dishes */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-z-line flex items-center justify-between">
          <h3 className="text-z-ink font-semibold">Menu ({restaurant.dishes.length} dishes)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-3 text-z-muted font-medium">Dish</th>
                <th className="px-6 py-3 text-z-muted font-medium">Price</th>
                <th className="px-6 py-3 text-z-muted font-medium">Available</th>
                <th className="px-6 py-3 text-z-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurant.dishes.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-z-muted">No dishes yet</td></tr>
              )}
              {restaurant.dishes.map((d) => {
                const isEditing = editingDishId === d.id;
                const rowBusy = busy === `dish-${d.id}`;
                return (
                  <tr key={d.id} className="border-t border-z-line-soft">
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <input
                          value={dishForm.name}
                          onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                          className="w-full rounded-lg border border-z-line bg-z-page px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-z-ink">{d.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={dishForm.price}
                          onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                          className="w-24 rounded-lg border border-z-line bg-z-page px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-z-sub tabular-nums">₹{d.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <button
                          onClick={() => setDishForm({ ...dishForm, isAvailable: !dishForm.isAvailable })}
                          className="flex items-center gap-1.5 text-xs font-medium"
                        >
                          {dishForm.isAvailable ? <FiToggleRight className="text-z-primary" size={20} /> : <FiToggleLeft className="text-z-muted" size={20} />}
                        </button>
                      ) : (
                        <span className={d.isAvailable ? "text-z-primary text-xs font-semibold" : "text-z-muted text-xs"}>
                          {d.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveDish(d.id)} disabled={rowBusy} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-z-primary text-white text-xs font-semibold disabled:opacity-50">
                            <FiCheck size={12} /> Save
                          </button>
                          <button onClick={() => setEditingDishId(null)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-z-page text-z-sub text-xs font-semibold">
                            <FiX size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEditDish(d)} className="text-z-primary hover:text-z-hover" aria-label="Edit dish">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => removeDish(d.id)} disabled={rowBusy} className="text-z-danger hover:opacity-70 disabled:opacity-50" aria-label="Delete dish">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-z-line">
          <h3 className="text-z-ink font-semibold">Orders ({orders.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-3 text-z-muted font-medium">Order ID</th>
                <th className="px-6 py-3 text-z-muted font-medium">Customer</th>
                <th className="px-6 py-3 text-z-muted font-medium">Total</th>
                <th className="px-6 py-3 text-z-muted font-medium">Status</th>
                <th className="px-6 py-3 text-z-muted font-medium">Placed</th>
                <th className="px-6 py-3 text-z-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-z-muted">No orders yet</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-z-line-soft hover:bg-z-page transition">
                  <td className="px-6 py-3 text-z-sub font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="px-6 py-3 text-z-sub">{o.user?.name || "—"}</td>
                  <td className="px-6 py-3 text-z-ink font-medium tabular-nums">₹{o.total.toFixed(0)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[o.status] || "bg-z-page text-z-muted border-z-line"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-z-muted text-xs">
                    {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => removeOrder(o.id)}
                      disabled={busy === `order-${o.id}`}
                      className="flex items-center gap-1.5 text-z-danger hover:opacity-70 text-xs font-semibold disabled:opacity-50"
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
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
