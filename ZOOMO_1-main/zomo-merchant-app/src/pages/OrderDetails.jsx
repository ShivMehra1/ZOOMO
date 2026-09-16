import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import OrderStatusActions from "../components/OrderStatusActions";
import CancelOrderButton from "../components/CancelOrderButton";
import api from "../services/api";

export default function OrderDetails() {
  const { restaurantId, orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(
          `/merchant/restaurants/${restaurantId}/orders/${orderId}`
        );

        const o = res.data;

        setOrder({
          id: o.id,
          customerName: o.user?.name || "Customer",
          status: o.status,
          total: o.total,
          items: o.items.map((i) => ({
            name: i.dish.name,
            qty: i.quantity,
            price: i.price,
          })),
          // ✅ Map dine-in fields from backend
          orderType: o.orderType || "DELIVERY",
          scheduledFor: o.scheduledFor || null,
          guestCount: o.guestCount || null,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [restaurantId, orderId]);

  const updateStatus = async (nextStatus) => {
    try {
      await api.patch(
        `/merchant/restaurants/${restaurantId}/orders/${orderId}/status`,
        { status: nextStatus }
      );
      setOrder((prev) => ({ ...prev, status: nextStatus }));
    } catch {
      alert("Failed to update order status");
    }
  };

  const cancelOrder = async () => {
    try {
      await api.patch(
        `/merchant/restaurants/${restaurantId}/orders/${orderId}/cancel`
      );
      setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
    } catch {
      alert("Failed to cancel order");
    }
  };

  if (loading) return <p className="text-z-sub text-sm py-12 text-center">Loading order details...</p>;
  if (error) return <p className="text-z-danger text-sm">{error}</p>;

  const isInStore = order.orderType === "DINE_IN" || order.orderType === "TAKEAWAY";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* ── HEADER ── */}
      <div className="card p-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="kicker">Order</p>
            {isInStore && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-z-sage text-z-primary">
                {order.orderType === "DINE_IN" ? "🍽️ Dine In" : "🥡 Takeaway"}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-z-ink mt-0.5">#{order.id.slice(0, 6)}</h1>
          <p className="text-sm text-z-sub mt-1">Customer: {order.customerName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ✅ DINE-IN / TAKEAWAY DETAILS CARD — only shown for in-store orders */}
      {isInStore && (
        <div className="card p-5">
          <h2 className="text-base font-bold text-z-ink mb-3">
            {order.orderType === "DINE_IN" ? "🍽️ Dine-In Details" : "🥡 Takeaway Details"}
          </h2>
          <div className="space-y-2">
            {order.scheduledFor && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-z-page">
                <span className="text-sm text-z-sub">
                  {order.orderType === "DINE_IN" ? "Dine-in time" : "Pickup time"}
                </span>
                <span className="text-sm font-bold text-z-ink">
                  {new Date(order.scheduledFor).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
            {order.orderType === "DINE_IN" && order.guestCount && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-z-page">
                <span className="text-sm text-z-sub">Guests</span>
                <span className="text-sm font-bold text-z-ink">
                  👥 {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-z-page">
              <span className="text-sm text-z-sub">Delivery</span>
              <span className="text-sm text-z-muted italic">Not required</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEMS ── */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-z-ink mb-3">Ordered Items</h2>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm bg-z-page rounded-xl px-4 py-3">
              <span className="text-z-ink">{item.name} × {item.qty}</span>
              <span className="font-bold text-z-ink">₹{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER — actions ── */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-lg font-bold text-z-ink">Total: ₹{order.total}</div>
        <div className="flex gap-2 w-full sm:w-auto">
          <CancelOrderButton status={order.status} onCancel={cancelOrder} />
          <OrderStatusActions status={order.status} orderType={order.orderType} onUpdate={updateStatus} />
        </div>
      </div>
    </div>
  );
}
