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

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading order details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const isInStore = order.orderType === "DINE_IN" || order.orderType === "TAKEAWAY";

  return (
    <div className="min-h-screen w-full flex justify-center items-start py-10 px-4">
      <div className="w-full max-w-3xl space-y-6">

        {/* ── HEADER ── */}
        <div className="rounded-3xl bg-white/95 dark:bg-[#141414] border border-black/5 dark:border-white/10 p-6 flex items-start justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Order #{order.id.slice(0, 6)}
              </h1>
              {/* ✅ Order type badge in header */}
              {isInStore && (
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${order.orderType === "DINE_IN"
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                  {order.orderType === "DINE_IN" ? "🍽️ Dine In" : "🥡 Takeaway"}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customer: {order.customerName}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* ✅ DINE-IN / TAKEAWAY DETAILS CARD — only shown for in-store orders */}
        {isInStore && (
          <div className="rounded-3xl bg-white/95 dark:bg-[#141414] border border-black/5 dark:border-white/10 p-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {order.orderType === "DINE_IN" ? "🍽️ Dine-In Details" : "🥡 Takeaway Details"}
            </h2>
            <div className="space-y-3">
              {order.scheduledFor && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f]">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {order.orderType === "DINE_IN" ? "Dine-in time" : "Pickup time"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(order.scheduledFor).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
              {order.orderType === "DINE_IN" && order.guestCount && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f]">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Guests</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    👥 {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}
                  </span>
                </div>
              )}
              {/* ✅ Explicitly confirm no delivery needed */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f]">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delivery</span>
                <span className="text-sm text-gray-500 dark:text-gray-500 italic">
                  Not required
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── ITEMS ── */}
        <div className="rounded-3xl bg-white/95 dark:bg-[#141414] border border-black/5 dark:border-white/10 p-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ordered Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx}
                className="flex items-center justify-between text-sm bg-gray-100 dark:bg-[#1f1f1f] rounded-2xl px-4 py-3">
                <span className="text-gray-800 dark:text-gray-200">
                  {item.name} × {item.qty}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ₹{item.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER — actions ── */}
        <div className="rounded-3xl bg-white/95 dark:bg-[#141414] border border-black/5 dark:border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Total: ₹{order.total}
          </div>
          <div className="flex gap-3">
            <CancelOrderButton status={order.status} onCancel={cancelOrder} />
            {/* ✅ Pass orderType so status actions know the correct flow */}
            <OrderStatusActions
              status={order.status}
              orderType={order.orderType}
              onUpdate={updateStatus}
            />
          </div>
        </div>

      </div>
    </div>
  );
}