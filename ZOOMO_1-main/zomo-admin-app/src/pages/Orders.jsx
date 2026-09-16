import { useEffect, useState } from "react";
import AssignDriverModal from "../components/AssignDriverModal";
import { getOrders, updateOrderStatus } from "../services/adminApi";
import { FiRefreshCw, FiTruck, FiClock, FiAlertCircle } from "react-icons/fi";

const STATUS_COLORS = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  READY_FOR_PICKUP: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 border-orange-200",
  DELIVERED: "bg-z-sage text-z-primary border-z-accent/20",
  CANCELLED: "bg-red-50 text-z-danger border-red-200",
};

// ✅ Order type badge — shown in place of driver/assign for dine-in & takeaway
function OrderTypeBadge({ type }) {
  if (!type || type === "DELIVERY") return null;
  const cfg = {
    DINE_IN: { label: "🍽️ Dine In", cls: "bg-violet-50 text-violet-700 border-violet-200" },
    TAKEAWAY: { label: "🥡 Takeaway", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const c = cfg[type];
  if (!c) return null;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      {c.label}
    </span>
  );
}

/* ── Scheduled orders panel ── */
function ScheduledOrdersPanel({ orders, onForceConfirm, onCancel }) {
  const scheduled = orders.filter(o => o.status === "SCHEDULED");
  if (scheduled.length === 0) return null;

  return (
    <div className="mb-6 p-5 rounded-card bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <FiClock className="text-blue-600" size={16} />
        <h3 className="text-z-ink font-semibold">Scheduled Orders</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
          {scheduled.length}
        </span>
      </div>
      <div className="space-y-3">
        {scheduled.map(order => {
          const t = new Date(order.scheduledFor);
          const mins = Math.round((t - new Date()) / 60000);
          const isPast = mins <= 0;
          const isUrgent = mins <= 30 && mins > 0;
          const isDineIn = order.orderType === "DINE_IN";
          const isTakeaway = order.orderType === "TAKEAWAY";

          return (
            <div key={order.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition ${isPast ? "bg-red-50 border-red-200" :
                  isUrgent ? "bg-orange-50 border-orange-200" :
                    "bg-z-surface border-z-line"}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(isPast || isUrgent) && (
                    <FiAlertCircle size={13}
                      className={isPast ? "text-z-danger" : "text-orange-500"} />
                  )}
                  <p className="text-z-ink text-sm font-medium">
                    #{order.id?.slice(0, 8).toUpperCase()}
                  </p>
                  {/* ✅ Show order type for dine-in/takeaway */}
                  {(isDineIn || isTakeaway) && (
                    <OrderTypeBadge type={order.orderType} />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? "bg-red-100 text-z-danger" :
                      isUrgent ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"}`}>
                    {isPast ? "Overdue" : `${mins} min away`}
                  </span>
                </div>
                <p className="text-z-sub text-xs">{order.restaurant?.name}</p>
                <p className="text-z-muted text-xs">
                  {order.user?.name} · ₹{order.total}
                  {isDineIn && order.guestCount ? ` · ${order.guestCount} guests` : ""}
                </p>
                <p className="text-blue-600 text-xs mt-0.5">
                  {isDineIn ? "🍽️ Dine-in" : isTakeaway ? "🥡 Pickup" : "📅 Delivery"} at{" "}
                  {t.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => onForceConfirm(order.id)}
                  className="px-3 py-1.5 rounded-lg bg-z-primary hover:bg-z-hover text-white text-xs font-semibold transition">
                  Force Confirm
                </button>
                <button onClick={() => onCancel(order.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-z-danger text-xs border border-red-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await getOrders();
      setOrders(res.data);
    } catch {
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  async function handleForceConfirm(orderId) {
    try {
      await updateOrderStatus(orderId, "PENDING");
      fetchOrders();
    } catch { alert("Failed to confirm order"); }
  }

  async function handleCancel(orderId) {
    if (!confirm("Cancel this scheduled order?")) return;
    try {
      await updateOrderStatus(orderId, "CANCELLED");
      fetchOrders();
    } catch { alert("Failed to cancel order"); }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Orders</h2>
          <p className="text-z-muted text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Scheduled Orders Panel */}
      <ScheduledOrdersPanel
        orders={orders}
        onForceConfirm={handleForceConfirm}
        onCancel={handleCancel}
      />

      {/* Orders Table */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-4 text-z-muted font-medium">Order ID</th>
                <th className="px-6 py-4 text-z-muted font-medium">Restaurant</th>
                <th className="px-6 py-4 text-z-muted font-medium">Customer</th>
                {/* ✅ Renamed from Address — shows address OR dine-in info */}
                <th className="px-6 py-4 text-z-muted font-medium">Delivery / Dine-in</th>
                <th className="px-6 py-4 text-z-muted font-medium">Scheduled</th>
                <th className="px-6 py-4 text-z-muted font-medium">Status</th>
                {/* ✅ Renamed — shows driver for delivery, order type for dine-in/takeaway */}
                <th className="px-6 py-4 text-z-muted font-medium">Driver / Type</th>
                <th className="px-6 py-4 text-z-muted font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-z-muted">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-z-muted">
                    No orders found
                  </td>
                </tr>
              )}
              {!loading && orders.map((order) => {
                const isDineIn = order.orderType === "DINE_IN";
                const isTakeaway = order.orderType === "TAKEAWAY";
                const isInStore = isDineIn || isTakeaway;

                return (
                  <tr key={order.id} className="border-t border-z-line-soft hover:bg-z-page transition">

                    <td className="px-6 py-4 text-z-sub font-mono text-xs">
                      #{order.id?.slice(0, 8)}
                    </td>

                    <td className="px-6 py-4 text-z-ink font-medium">
                      {order.restaurant?.name || "—"}
                    </td>

                    <td className="px-6 py-4 text-z-sub">
                      {order.user?.name || "—"}
                    </td>

                    {/* ✅ Address OR dine-in details */}
                    <td className="px-6 py-4 text-z-sub">
                      {isDineIn ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-violet-600 text-xs font-semibold">🍽️ Dine In</span>
                          {order.guestCount && (
                            <span className="text-z-muted text-xs">{order.guestCount} guests</span>
                          )}
                        </div>
                      ) : isTakeaway ? (
                        <span className="text-amber-600 text-xs font-semibold">🥡 Takeaway</span>
                      ) : (
                        order.address
                          ? `${order.address.street}, ${order.address.city}`
                          : "—"
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {order.scheduledFor ? (
                        <span className="flex items-center gap-1 text-blue-600 text-xs">
                          <FiClock size={11} />
                          {new Date(order.scheduledFor).toLocaleString("en-IN", {
                            dateStyle: "short", timeStyle: "short"
                          })}
                        </span>
                      ) : (
                        <span className="text-z-muted text-xs">ASAP</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit
                          ${STATUS_COLORS[order.status] || "bg-z-page text-z-muted border-z-line"}`}>
                          {order.status}
                        </span>
                        {/* ✅ Show dine-in/takeaway label under status */}
                        {isInStore && <OrderTypeBadge type={order.orderType} />}
                      </div>
                    </td>

                    {/* ✅ Driver column — hidden for dine-in/takeaway */}
                    <td className="px-6 py-4">
                      {isInStore ? (
                        <span className="text-z-muted text-xs italic">Not required</span>
                      ) : order.driverId ? (
                        <span className="flex items-center gap-1 text-z-primary text-xs font-medium">
                          <FiTruck size={13} /> {order.driver?.user?.name || "Assigned"}
                        </span>
                      ) : (
                        <span className="text-z-muted text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* ✅ Assign Driver button — hidden for dine-in/takeaway */}
                    <td className="px-6 py-4">
                      {isInStore ? (
                        <span className="text-z-muted text-xs">—</span>
                      ) : (
                        <button
                          disabled={!!order.driverId || order.status !== "READY_FOR_PICKUP"}
                          onClick={() => setSelectedOrder(order)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${!order.driverId && order.status === "READY_FOR_PICKUP"
                              ? "bg-z-primary text-white hover:bg-z-hover"
                              : "bg-z-page text-z-muted cursor-not-allowed"
                            }`}
                        >
                          {order.driverId ? "Assigned" : "Assign Driver"}
                        </button>
                      )}
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
          onAssigned={() => { setSelectedOrder(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}