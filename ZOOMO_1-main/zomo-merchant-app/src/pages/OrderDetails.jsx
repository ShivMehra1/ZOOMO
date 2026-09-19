import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import OrderStatusActions from "../components/OrderStatusActions";
import CancelOrderButton from "../components/CancelOrderButton";
import api from "../services/api";
import { formatWhen } from "../lib/when";
import { joinRoom, leaveRoom, socket } from "../lib/socket";

export default function OrderDetails() {
  const { restaurantId, orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef(null);

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
          createdAt: o.createdAt,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [restaurantId, orderId]);

  useEffect(() => {
    if (!restaurantId || !orderId) return;
    let mounted = true;
    api
      .get(`/merchant/restaurants/${restaurantId}/orders/${orderId}/messages`)
      .then((res) => mounted && setMessages(res.data || []))
      .catch(() => {});
    joinRoom(`order:${orderId}`);
    joinRoom(`restaurant:${restaurantId}`);
    const onMessage = (msg) => {
      if (msg.orderId !== orderId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on("order:message", onMessage);
    return () => {
      mounted = false;
      leaveRoom(`order:${orderId}`);
      leaveRoom(`restaurant:${restaurantId}`);
      socket.off("order:message", onMessage);
    };
  }, [restaurantId, orderId]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendChat(e) {
    e.preventDefault();
    const text = chatText.trim();
    if (!text || sending) return;
    setSending(true);
    setChatText("");
    try {
      const res = await api.post(`/merchant/restaurants/${restaurantId}/orders/${orderId}/messages`, { text });
      setMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]));
    } catch {
      setChatText(text);
    } finally {
      setSending(false);
    }
  }

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

  const isInStore = order.orderType === "DINE_IN" || order.orderType === "TAKEAWAY" || order.orderType === "PICKUP";

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
          <p className="text-xs text-z-muted mt-1">Placed {formatWhen(order.createdAt)}</p>
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
                  {formatWhen(order.scheduledFor)}
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

      <div className="card p-5 space-y-3">
        <h2 className="text-base font-bold text-z-ink">Chat with customer</h2>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-z-page p-3">
          {messages.length === 0 && (
            <p className="text-xs text-z-muted">No messages yet. Ask if they need cutlery, extra spice, or a gate code.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "RESTAURANT" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.sender === "RESTAURANT" ? "bg-z-primary text-white" : "bg-white text-z-ink"
                }`}
              >
                {m.sender !== "RESTAURANT" && (
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {m.sender === "DRIVER" ? "Driver" : "Customer"}
                  </p>
                )}
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
        <form onSubmit={sendChat} className="flex gap-2">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Message the customer…"
            className="field flex-1 h-11"
          />
          <button type="submit" disabled={sending || !chatText.trim()} className="btn-primary w-auto px-4 h-11 text-sm">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
