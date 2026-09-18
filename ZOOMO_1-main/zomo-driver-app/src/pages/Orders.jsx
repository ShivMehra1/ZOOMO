import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { fetchAssignedOrders } from "../services/driverApi";
import { useDriverAuth } from "../context/DriverAuthContext";
import { useDriverSocket } from "../hooks/useDriverSocket";
import { formatWhen } from "../lib/when";
import { statusLabel } from "../lib/order-labels";

export default function Orders() {
  const navigate = useNavigate();
  const { driver } = useDriverAuth();
  const socket = useDriverSocket();

  const isOnline = Boolean(driver?.isAvailable);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const data = await fetchAssignedOrders();
        setOrders(data);
      } catch {
        setError("Unable to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Live: a new assignment or a status change on one of ours — just
    // refetch the (small) assigned-orders list rather than trying to
    // patch individual entries.
    const onOrderUpdated = () => loadOrders();
    socket.on("order:updated", onOrderUpdated);
    return () => socket.off("order:updated", onOrderUpdated);
  }, [isOnline, socket]);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-z-page pb-28">
        <Header title="Driver" />
        <div className="mx-auto max-w-xl px-4 pt-16 pb-28 flex flex-col items-center text-center">
          <p className="kicker mb-2">Offline</p>
          <h1 className="display text-2xl text-z-ink mb-2">
            You are offline
          </h1>
          <p className="text-sm text-z-sub max-w-xs">
            Go online to start receiving and managing delivery orders.
          </p>
          <button
            className="btn-primary mt-6 w-auto px-6 h-12"
            onClick={() => navigate("/home")}
          >
            Go to home
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Driver" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="kicker mb-1">Deliveries</p>
        <h1 className="display text-2xl text-z-ink mb-6">
          My deliveries
        </h1>

        {loading && (
          <p className="text-center text-sm text-z-sub mt-10">Loading orders...</p>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-z-danger mt-10">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPickup = order.status === "READY_FOR_PICKUP";

              return (
                <div
                  key={order.id}
                  className="rounded-[28px] bg-z-surface shadow-card p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">
                        {order.restaurant.name} · #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <span className={`badge ${isPickup ? "tone-wait" : "tone-go"}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  <p className="text-xs text-z-muted mb-2">Assigned {formatWhen(order.createdAt)}</p>
                  <div className="space-y-1 text-sm text-z-sub mb-4">
                    <p>
                      <span className="font-semibold text-z-ink">Pickup: </span>
                      {order.restaurant.address}
                    </p>
                    <p>
                      <span className="font-semibold text-z-ink">Drop: </span>
                      {order.address.street}, {order.address.city}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-z-ink">
                      ₹{order.total}
                    </span>
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="btn-primary w-auto px-5 h-10 text-sm"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <p className="rounded-[24px] bg-z-surface shadow-card p-8 text-center text-sm text-z-sub">
                No deliveries assigned yet. Stay online to receive orders.
              </p>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
