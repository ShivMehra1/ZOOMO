import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import BottomNav from "../components/BottomNav";
import {
  markOrderPickedUp,
  markOrderDelivered,
  fetchOrderDetails,
} from "../services/driverApi";
import { useDriverAuth } from "../context/DriverAuthContext";
import { useDriverLocation } from "../hooks/useDriverLocation";
import DriverMap from "../components/DriverMap";
import { getDistanceMeters } from "../utils/distance";
import {
  FiArrowLeft,
  FiChevronRight,
  FiUser,
  FiPackage,
  FiCreditCard,
  FiPhone,
  FiCopy,
  FiCheckCircle,
} from "react-icons/fi";

const PICKUP_RADIUS = 150;
const DELIVERY_RADIUS = 100;

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { driver } = useDriverAuth();
  const driverLocation = useDriverLocation();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [codPaymentConfirmed, setCodPaymentConfirmed] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const isOnline = Boolean(driver?.isAvailable);

  useEffect(() => {
    if (!isOnline) navigate("/home", { replace: true });
  }, [isOnline, navigate]);

  useEffect(() => {
    let mounted = true;
    setFetchError("");
    fetchOrderDetails(id)
      .then((data) => {
        if (!mounted) return;
        setOrder(data);
        setStatus(data.status);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("fetchOrderDetails error:", err);
        setFetchError("Could not load order. Please go back and retry.");
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const isPickupPhase = status === "READY_FOR_PICKUP";

  const target = useMemo(() => {
    if (!order) return null;
    return isPickupPhase ? order.restaurant : order.address;
  }, [order, isPickupPhase]);

  const distance = useMemo(() => {
    if (!driverLocation || !target?.lat || !target?.lng) return null;
    return getDistanceMeters(
      driverLocation.lat,
      driverLocation.lng,
      target.lat,
      target.lng
    );
  }, [driverLocation, target]);

  const isNearTarget = useMemo(() => {
    if (distance == null) return true;
    return isPickupPhase
      ? distance <= PICKUP_RADIUS
      : distance <= DELIVERY_RADIUS;
  }, [distance, isPickupPhase]);

  const paymentMethod = order?.payment?.method || "ONLINE";
  const isCOD = paymentMethod === "COD";

  const customerName = order?.customer?.name || "Customer";
  const customerPhone = order?.customer?.phone || null;

  async function handlePickup() {
    if (!order || loading) return;
    setLoading(true);
    try {
      await markOrderPickedUp(id);
      setStatus("OUT_FOR_DELIVERY");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm pickup. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDelivered() {
    if (!order) return;
    try {
      setUpdating(true);
      setUpdateError("");
      await markOrderDelivered(order.id);
      navigate("/delivery-complete");
    } catch (err) {
      console.error(err);
      setUpdateError("Failed to mark as delivered. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  const swipeHandlers = useSwipeable({
    onSwipedRight: isPickupPhase ? handlePickup : handleMarkDelivered,
    delta: 90,
    trackMouse: true,
  });

  const copyAddress = () => {
    if (!order?.address) return;
    navigator.clipboard.writeText(
      `${order.address.street}, ${order.address.city}`
    );
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-z-page flex flex-col items-center justify-center gap-4">
        {fetchError ? (
          <>
            <p className="text-z-danger text-sm px-6 text-center">{fetchError}</p>
            <button
              onClick={() => navigate("/orders")}
              className="btn-primary w-auto px-6 h-11 text-sm"
            >
              Back to orders
            </button>
          </>
        ) : (
          <p className="text-z-sub text-sm">Loading order...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-z-page pb-28">
      {/* HEADER IMAGE */}
      <div className="relative h-44">
        <img
          src={order.restaurant?.imageUrl}
          alt={order.restaurant?.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white bg-black/40 p-2 rounded-full"
        >
          <FiArrowLeft />
        </button>
        <div className="absolute bottom-3 left-4 text-white">
          <p className="text-[11px] font-bold tracking-wide uppercase text-white/70">
            #{order.id?.slice(0, 8)}
          </p>
          <h1 className="display text-lg">{order.restaurant?.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-4 space-y-4">
        {/* PHASE BANNER */}
        <div className={`badge ${isPickupPhase ? "tone-wait" : "tone-go"} block w-fit`}>
          {isPickupPhase ? "Navigate to restaurant for pickup" : "Deliver order to customer"}
        </div>

        {/* MAP */}
        <DriverMap
          restaurant={order.restaurant}
          customer={order.address}
          status={status}
        />

        {/* DISTANCE */}
        {distance !== null && (
          <div
            className={`text-center text-sm font-bold ${
              isNearTarget ? "text-z-accent" : "text-z-danger"
            }`}
          >
            {isNearTarget ? "You are near the target" : `${(distance / 1000).toFixed(2)} km away`}
          </div>
        )}

        {/* CUSTOMER */}
        <div className="rounded-card p-4 shadow-card bg-z-surface space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
            <FiUser size={14} /> Customer
          </div>
          <div className="flex justify-between items-start">
            <div className="text-sm">
              <div className="font-bold text-z-ink">{customerName}</div>
              <div className="text-z-sub">
                {order.address?.street}, {order.address?.city}
              </div>
            </div>
            <div className="flex gap-3 text-z-sub">
              <button onClick={copyAddress}>
                <FiCopy size={16} />
              </button>
              {customerPhone && (
                <a href={`tel:${customerPhone}`} className="text-z-primary">
                  <FiPhone size={16} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="rounded-card p-4 shadow-card bg-z-surface space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
            <FiPackage size={14} /> Items
          </div>
          {order.items?.map((item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            return (
              <div key={item.id} className="flex justify-between text-sm text-z-sub">
                <span>{item.dish?.name ?? "Item"} × {qty}</span>
                <span className="font-semibold text-z-ink">
                  ₹{(price * qty).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* PAYMENT */}
        <div className="rounded-card p-4 shadow-card bg-z-surface space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
            <FiCreditCard size={14} /> Payment
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-z-sub">{paymentMethod}</span>
            <span className="font-bold text-z-ink">
              ₹{Number(order.total).toFixed(2)}
            </span>
          </div>

          {isCOD && status === "OUT_FOR_DELIVERY" && (
            <button
              onClick={() => setCodPaymentConfirmed((prev) => !prev)}
              className={`w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                codPaymentConfirmed
                  ? "border-z-accent bg-z-sage text-z-primary"
                  : "border-amber-400 bg-amber-50 text-amber-700"
              }`}
            >
              <FiCheckCircle
                className={codPaymentConfirmed ? "text-z-accent" : "text-amber-400"}
                size={18}
              />
              {codPaymentConfirmed ? "Cash collected" : "Tap to confirm cash collected"}
            </button>
          )}
        </div>

        {/* RESTAURANT ADDRESS */}
        {isPickupPhase && (
          <div className="rounded-card p-4 shadow-card bg-z-surface space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
              <FiUser size={14} /> Restaurant address
            </div>
            <div className="text-sm">
              <div className="font-bold text-z-ink">{order.restaurant?.name}</div>
              <div className="text-z-sub">
                {order.restaurant?.address || "Address not available"}
              </div>
            </div>
          </div>
        )}

        {updateError && (
          <div className="rounded-xl bg-z-danger/10 px-3 py-2">
            <p className="text-sm text-z-danger font-medium">{updateError}</p>
          </div>
        )}

        {status === "READY_FOR_PICKUP" && (
          <button
            {...swipeHandlers}
            onClick={handlePickup}
            disabled={loading}
            className="w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2
                       bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60
                       transition-all active:scale-[0.98]"
          >
            <FiChevronRight />
            {loading ? "Confirming..." : "Confirm pickup"}
          </button>
        )}

        {status === "OUT_FOR_DELIVERY" && (
          <button
            {...swipeHandlers}
            onClick={handleMarkDelivered}
            disabled={updating || (isCOD && !codPaymentConfirmed)}
            className={`w-full h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isCOD && !codPaymentConfirmed
                ? "bg-z-line text-z-muted cursor-not-allowed"
                : "bg-z-primary text-white hover:bg-z-hover"
            }`}
          >
            <FiChevronRight />
            {updating
              ? "Completing..."
              : isCOD && !codPaymentConfirmed
              ? "Confirm cash first"
              : "Confirm delivery"}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
