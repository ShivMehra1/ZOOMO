import { useEffect, useMemo, useRef, useState } from "react";
import AssignDriverModal from "../components/AssignDriverModal";
import { getOrders, getRestaurants, updateOrderStatus } from "../services/adminApi";
import { getAdminSocket } from "../lib/socket";
import { useConfirm } from "../context/ConfirmContext";
import { formatWhen, rangePreset, toLocalInput } from "../lib/when";
import { statusLabel } from "../lib/order-labels";
import { FiRefreshCw, FiTruck, FiClock, FiAlertCircle, FiCheck, FiDownload, FiSearch } from "react-icons/fi";
import GreenSwitch from "../components/GreenSwitch";

const STATUS_COLORS = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  READY_FOR_PICKUP: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 border-orange-200",
  DELIVERED: "bg-z-sage text-z-primary border-z-accent/20",
  CANCELLED: "bg-red-50 text-z-danger border-red-200",
};

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

const STATUSES = ["", "PENDING", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "SCHEDULED"];
const TYPES = ["", "DELIVERY", "PICKUP", "DINE_IN"];

function OrderTypeBadge({ type }) {
  if (!type || type === "DELIVERY") return null;
  const cfg = {
    DINE_IN: { label: "Dine in", cls: "bg-violet-50 text-violet-700 border-violet-200" },
    TAKEAWAY: { label: "Pickup", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PICKUP: { label: "Pickup", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const c = cfg[type];
  if (!c) return null;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>{c.label}</span>;
}

function ScheduledOrdersPanel({ orders, onForceConfirm, onCancel }) {
  const scheduled = orders.filter((o) => o.status === "SCHEDULED");
  if (scheduled.length === 0) return null;
  return (
    <div className="mb-6 p-5 rounded-card bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="text-blue-600" size={16} />
        <h3 className="text-z-ink font-semibold">Scheduled orders</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{scheduled.length}</span>
      </div>
      <div className="space-y-3">
        {scheduled.map((order) => {
          const t = new Date(order.scheduledFor);
          const mins = Math.round((t - new Date()) / 60000);
          const isPast = mins <= 0;
          const isUrgent = mins <= 30 && mins > 0;
          return (
            <div key={order.id} className={`flex items-center justify-between p-4 rounded-xl border ${isPast ? "bg-red-50 border-red-200" : isUrgent ? "bg-orange-50 border-orange-200" : "bg-z-surface border-z-line"}`}>
              <div>
                <p className="text-z-ink text-sm font-medium">#{order.id?.slice(0, 8).toUpperCase()} · {order.restaurant?.name}</p>
                <p className="text-z-muted text-xs mt-0.5">{order.user?.name} · {formatWhen(order.scheduledFor)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => onForceConfirm(order.id)} className="px-3 py-1.5 rounded-lg bg-z-primary text-white text-xs font-semibold">Force confirm</button>
                <button onClick={() => onCancel(order.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-z-danger text-xs border border-red-200">Cancel</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function kitchenAction(order) {
  const type = order.orderType;
  const inStore = type === "DINE_IN" || type === "TAKEAWAY" || type === "PICKUP";
  if (order.status === "PENDING") return { label: "Accept order", next: "PREPARING" };
  if (order.status === "PREPARING") return { label: "Mark ready", next: "READY_FOR_PICKUP" };
  if (order.status === "READY_FOR_PICKUP" && inStore) {
    return { label: type === "DINE_IN" ? "Mark served" : "Mark collected", next: "DELIVERED" };
  }
  return null;
}

function buildParams(f) {
  const params = {};
  if (f.restaurantId) params.restaurantId = f.restaurantId;
  if (f.status) params.status = f.status;
  if (f.orderType) params.orderType = f.orderType;
  if (f.search.trim()) params.search = f.search.trim();
  if (f.from) params.from = new Date(f.from).toISOString();
  if (f.to) params.to = new Date(f.to).toISOString();
  return params;
}

export default function Orders() {
  const { confirm } = useConfirm();
  const today = rangePreset("today");
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [live, setLive] = useState(true);
  const [preset, setPreset] = useState("today");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    orderType: "",
    restaurantId: "",
    from: toLocalInput(today.from),
    to: toLocalInput(today.to),
  });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  async function fetchOrders(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError("");
      const res = await getOrders(buildParams(filtersRef.current));
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || "Could not load orders.");
        setOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    getRestaurants().then((r) => setRestaurants(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchOrders(false), 200);
    return () => clearTimeout(t);
  }, [filters.search, filters.status, filters.orderType, filters.restaurantId, filters.from, filters.to]);

  useEffect(() => {
    if (!live) return undefined;
    let socket;
    try {
      socket = getAdminSocket();
      const ping = () => fetchOrders(true);
      socket.on("order:created", ping);
      socket.on("order:updated", ping);
      return () => {
        socket.off("order:created", ping);
        socket.off("order:updated", ping);
      };
    } catch {
      return undefined;
    }
  }, [live]);

  function applyPreset(key) {
    setPreset(key);
    const r = rangePreset(key);
    setFilters((f) => ({
      ...f,
      from: r.from ? toLocalInput(r.from) : "",
      to: r.to ? toLocalInput(r.to) : "",
    }));
  }

  async function handleForceConfirm(orderId) {
    try {
      await updateOrderStatus(orderId, "PENDING");
      fetchOrders(true);
    } catch { alert("Failed to confirm order"); }
  }

  async function handleCancel(orderId) {
    const ok = await confirm({ title: "Cancel this order?", body: "The customer will see it as cancelled.", confirmLabel: "Cancel order" });
    if (!ok) return;
    try {
      await updateOrderStatus(orderId, "CANCELLED");
      fetchOrders(true);
    } catch { alert("Failed to cancel order"); }
  }

  async function handleKitchen(order, next) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, next);
      await fetchOrders(true);
    } catch (err) {
      alert(err?.response?.data?.message || "Could not update that order");
    } finally {
      setBusyId(null);
    }
  }

  const totals = useMemo(() => {
    const kept = orders.filter((o) => o.status !== "CANCELLED");
    return {
      count: orders.length,
      revenue: kept.reduce((s, o) => s + Number(o.total || 0), 0),
    };
  }, [orders]);

  function exportCsv() {
    const header = ["Placed", "Order ID", "Restaurant", "Customer", "Phone", "Type", "Status", "Total", "Scheduled"];
    const rows = orders.map((o) => [
      formatWhen(o.createdAt),
      o.id,
      o.restaurant?.name || "",
      o.user?.name || "",
      o.user?.phone || "",
      o.orderType || "",
      o.status || "",
      o.total ?? "",
      o.scheduledFor ? formatWhen(o.scheduledFor) : "ASAP",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zoomo-orders-${preset || "filtered"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Orders</h2>
          <p className="text-z-muted text-sm mt-1">
            {totals.count} in this window · ₹{totals.revenue.toFixed(0)} (ex-cancelled) · times in IST
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-z-surface border border-z-line">
            <span className="text-xs font-semibold text-z-sub">Live updates</span>
            <GreenSwitch on={live} label="Live updates" onToggle={() => setLive((v) => !v)} />
          </div>
          <button type="button" onClick={exportCsv} disabled={!orders.length} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary text-sm disabled:opacity-50">
            <FiDownload size={14} /> Export CSV
          </button>
          <button type="button" onClick={() => fetchOrders(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary text-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${preset === p.key ? "bg-z-sage text-z-primary shadow-glow" : "bg-z-page text-z-sub border border-z-line"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="md:col-span-2 block">
            <span className="text-[11px] font-semibold text-z-muted">Search</span>
            <div className="relative mt-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={14} />
              <input className="field pl-9" placeholder="Customer, phone, restaurant, order id" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-z-muted">From</span>
            <input className="field mt-1" type="datetime-local" value={filters.from} onChange={(e) => { setPreset("custom"); setFilters({ ...filters, from: e.target.value }); }} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-z-muted">To</span>
            <input className="field mt-1" type="datetime-local" value={filters.to} onChange={(e) => { setPreset("custom"); setFilters({ ...filters, to: e.target.value }); }} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-z-muted">Status</span>
            <select className="field mt-1" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s || "all"} value={s}>{s || "All statuses"}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-z-muted">Type</span>
            <select className="field mt-1" value={filters.orderType} onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}>
              {TYPES.map((t) => <option key={t || "all"} value={t}>{t === "PICKUP" ? "Pickup" : t === "DINE_IN" ? "Dine in" : t === "DELIVERY" ? "Delivery" : "All types"}</option>)}
            </select>
          </label>
        </div>
        <label className="block max-w-sm">
          <span className="text-[11px] font-semibold text-z-muted">Restaurant</span>
          <select className="field mt-1" value={filters.restaurantId} onChange={(e) => setFilters({ ...filters, restaurantId: e.target.value })}>
            <option value="">All restaurants</option>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-z-danger">{error}</div>}

      <ScheduledOrdersPanel orders={orders} onForceConfirm={handleForceConfirm} onCancel={handleCancel} />

      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-5 py-3 text-z-muted font-medium">Placed</th>
                <th className="px-5 py-3 text-z-muted font-medium">Order</th>
                <th className="px-5 py-3 text-z-muted font-medium">Restaurant</th>
                <th className="px-5 py-3 text-z-muted font-medium">Customer</th>
                <th className="px-5 py-3 text-z-muted font-medium">Type</th>
                <th className="px-5 py-3 text-z-muted font-medium">Status</th>
                <th className="px-5 py-3 text-z-muted font-medium">Total</th>
                <th className="px-5 py-3 text-z-muted font-medium">Driver</th>
                <th className="px-5 py-3 text-z-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="px-6 py-12 text-center text-z-muted">Loading orders...</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-z-muted">No orders in this date range</td></tr>}
              {!loading && orders.map((order) => {
                const isDineIn = order.orderType === "DINE_IN";
                const isTakeaway = order.orderType === "TAKEAWAY" || order.orderType === "PICKUP";
                const isInStore = isDineIn || isTakeaway;
                const kitchen = kitchenAction(order);
                return (
                  <tr key={order.id} className="border-t border-z-line-soft hover:bg-z-page">
                    <td className="px-5 py-3">
                      <p className="text-z-ink text-xs font-semibold">{formatWhen(order.createdAt)}</p>
                      {order.scheduledFor && <p className="text-[11px] text-blue-600 mt-0.5">For {formatWhen(order.scheduledFor)}</p>}
                    </td>
                    <td className="px-5 py-3 text-z-sub font-mono text-xs">#{order.id?.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-z-ink font-medium">{order.restaurant?.name || "—"}</td>
                    <td className="px-5 py-3">
                      <p className="text-z-sub">{order.user?.name || "—"}</p>
                      <p className="text-[11px] text-z-muted">{order.user?.phone || order.user?.email || ""}</p>
                    </td>
                    <td className="px-5 py-3">
                      {isDineIn ? <OrderTypeBadge type="DINE_IN" /> : isTakeaway ? <OrderTypeBadge type="PICKUP" /> : <span className="text-xs text-z-sub">Delivery</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || "bg-z-page text-z-muted border-z-line"}`}>{statusLabel(order.status)}</span>
                    </td>
                    <td className="px-5 py-3 text-z-ink font-semibold tabular-nums">₹{Number(order.total || 0).toFixed(0)}</td>
                    <td className="px-5 py-3">
                      {isInStore ? <span className="text-z-muted text-xs">—</span> : order.driverId ? (
                        <span className="flex items-center gap-1 text-z-primary text-xs font-medium"><FiTruck size={13} /> {order.driver?.user?.name || "Assigned"}</span>
                      ) : <span className="text-z-muted text-xs">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        {kitchen && (
                          <button type="button" disabled={busyId === order.id} onClick={() => handleKitchen(order, kitchen.next)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-z-primary text-white disabled:opacity-50">
                            <FiCheck size={12} /> {busyId === order.id ? "Saving…" : kitchen.label}
                          </button>
                        )}
                        {!isInStore && order.status === "READY_FOR_PICKUP" && (
                          <button disabled={!!order.driverId} onClick={() => setSelectedOrder(order)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${!order.driverId ? "border border-z-line text-z-primary" : "bg-z-page text-z-muted"}`}>
                            {order.driverId ? "Driver assigned" : "Assign driver"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <AssignDriverModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAssigned={() => { setSelectedOrder(null); fetchOrders(true); }}
        />
      )}
    </div>
  );
}
