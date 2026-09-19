import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import BottomNav from "../components/BottomNav";
import {
  markOrderPickedUp,
  markOrderDelivered,
  fetchOrderDetails,
  fetchOrderMessages,
  sendOrderMessage,
  uploadDeliveryProof,
} from "../services/driverApi";
import { formatWhen } from "../lib/when";
import { isCashCollect, payLabel } from "../lib/pay";
import { useDriverAuth } from "../context/DriverAuthContext";
import { useDriverLocation } from "../hooks/useDriverLocation";
import { useDriverSocket, useOrderRoom } from "../hooks/useDriverSocket";
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
  FiMessageCircle,
  FiSend,
  FiCamera,
} from "react-icons/fi";

const PICKUP_RADIUS = 150;
const DELIVERY_RADIUS = 100;

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { driver } = useDriverAuth();
  const driverLocation = useDriverLocation();
  const socket = useDriverSocket();
  useOrderRoom(id);

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [codPaymentConfirmed, setCodPaymentConfirmed] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const [pin, setPin] = useState("");

  const isOnline = Boolean(driver?.isAvailable);

  useEffect(() => {
    if (driver && !isOnline) navigate("/home", { replace: true });
  }, [driver, isOnline, navigate]);

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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    fetchOrderMessages(id)
      .then((data) => mounted && setMessages(data))
      .catch(() => {});
    const onMessage = (msg) => {
      if (msg.orderId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on("order:message", onMessage);
    return () => {
      mounted = false;
      socket.off("order:message", onMessage);
    };
  }, [id, socket]);

  async function handleSendMessage(e) {
    e.preventDefault();
    const text = chatText.trim();
    if (!text || sendingMessage) return;
    setSendingMessage(true);
    setChatText("");
    try {
      const message = await sendOrderMessage(id, text);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch {
      setChatText(text);
    } finally {
      setSendingMessage(false);
    }
  }

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

  const paymentMethod = order?.payment?.method || "COD";
  const isCOD = isCashCollect(paymentMethod);

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
      await markOrderDelivered(order.id, proofUrl || undefined, isCOD ? undefined : pin);
      navigate("/delivery-complete");
    } catch (err) {
      console.error(err);
      setUpdateError(err.message || "Failed to mark as delivered. Try again.");
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
            #{order.id?.slice(0, 8)} · {formatWhen(order.createdAt)}
          </p>
          <h1 className="display text-lg">{order.restaurant?.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-4 space-y-4">
        {/* PHASE BANNER */}
        <div className={`badge ${isPickupPhase ? "tone-wait" : "tone-go"} block w-fit`}>
          {isPickupPhase ? "Navigate to restaurant for pickup" : "Deliver order to customer"}
        </div>
        {order.adminAssigned && (
          <p className="rounded-xl bg-z-sage px-3 py-2 text-xs font-bold text-z-primary">
            Assigned by Admin — this drop needs to be completed.
          </p>
        )}

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

        {/* CHAT */}
        <div className="rounded-card p-4 shadow-card bg-z-surface space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
            <FiMessageCircle size={14} /> Message customer
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-z-muted">No messages yet — say hi if you're running late or can't find the gate.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "DRIVER" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.sender === "DRIVER" ? "bg-z-primary text-white" : "bg-z-sage text-z-ink"
                  }`}
                >
                  {m.sender !== "DRIVER" && (
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide opacity-70">
                      {m.sender === "RESTAURANT" ? "Restaurant" : "Customer"}
                    </p>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Type a message..."
              className="field flex-1 h-11"
            />
            <button
              type="submit"
              disabled={sendingMessage || !chatText.trim()}
              className="w-11 h-11 shrink-0 rounded-xl bg-z-primary text-white flex items-center justify-center disabled:opacity-50 active:scale-[0.96] transition"
            >
              <FiSend size={16} />
            </button>
          </form>
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
            <span className="text-z-sub">{payLabel(paymentMethod)}</span>
            <span className="font-bold text-z-ink">
              ₹{Number(order.total).toFixed(2)}
            </span>
          </div>
          <p className={`text-sm font-bold ${isCOD ? "text-z-primary" : "text-z-ink"}`}>
            {isCOD ? `Collect ₹${Math.round(Number(order.total))} in cash` : "Already paid — collect ₹0. Ask for the PIN."}
          </p>
          {(Number(order.tip) > 0 || Number(order.postDeliveryTip) > 0) && (
            <p className="text-sm font-bold text-z-primary">
              Tip ₹{Math.round(Number(order.tip || 0) + Number(order.postDeliveryTip || 0))} from this customer
            </p>
          )}

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
            className="btn-primary w-full h-14 text-base disabled:opacity-60"
          >
            <FiChevronRight />
            {loading ? "Confirming..." : "Confirm pickup"}
          </button>
        )}

        {status === "OUT_FOR_DELIVERY" && (
          <div className="rounded-card p-4 shadow-card bg-z-surface space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-z-muted uppercase">
              <FiCamera size={14} /> Proof of delivery
            </div>
            <p className="text-xs text-z-sub">
              Photo of the bag at the gate. The customer sees this after you complete.
            </p>
            {proofUrl ? (
              <img src={proofUrl} alt="Delivery proof" className="h-40 w-full rounded-xl object-cover" />
            ) : null}
            <label className="btn-ghost h-11 w-full text-sm flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setProofBusy(true);
                  try {
                    const { url } = await uploadDeliveryProof(file);
                    setProofUrl(url);
                  } catch (err) {
                    setUpdateError(err.message || "Could not upload photo");
                  } finally {
                    setProofBusy(false);
                  }
                }}
              />
              {proofBusy ? "Uploading…" : proofUrl ? "Replace photo" : "Take or upload photo"}
            </label>
            {!isCOD && (
              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN from customer"
                className="field h-12 tracking-[0.4em] text-center text-lg font-bold"
              />
            )}
            <button
              {...swipeHandlers}
              onClick={handleMarkDelivered}
              disabled={updating || proofBusy || (isCOD && !codPaymentConfirmed) || (!isCOD && pin.length !== 4)}
              className={`btn-primary w-full h-14 text-base ${
                (isCOD && !codPaymentConfirmed) || (!isCOD && pin.length !== 4)
                  ? "opacity-45 cursor-not-allowed shadow-none"
                  : ""
              }`}
            >
              <FiChevronRight />
              {updating
                ? "Completing..."
                : isCOD && !codPaymentConfirmed
                ? "Confirm cash first"
                : !isCOD && pin.length !== 4
                ? "Enter customer PIN"
                : proofUrl
                ? "Confirm delivery"
                : "Complete without photo"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
