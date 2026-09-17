import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Phone,
  Share2,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { LiveRideMap } from "./live-ride-map";
import { StatusPill, useTick } from "./tracker";
import { getSocket, joinRoom, leaveRoom } from "@/lib/socket";
import {
  DROP_OFF,
  IMG,
  LATE_CREDIT,
  ORDER_STATUS,
  etaMinutes,
  gateBy,
  inr,
  isNearby,
  liveProgress,
  liveStatus,
  restaurantById,
  rideProgress,
  riderAssigned,
  riderById,
  riderFinding,
  riderFor,
  stepsFor,
  trackHeadline,
} from "@/lib/zoomo-data";
import { useZoomo, type Order } from "@/lib/zoomo-store";
import { useGoBack } from "@/lib/zoomo-nav";

export function UberTrack({ order }: { order: Order }) {
  useTick(400);
  const nav = useNavigate();
  const back = useGoBack("/orders");
  const {
    cancelOrder,
    pingGate,
    grantLateCredit,
    setDropOff,
    sendRideChat,
    rateOrder,
    setProof,
    reorder,
  } = useZoomo();
  const [sheet, setSheet] = useState<"mini" | "full">("mini");
  const [chatOpen, setChatOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const [liveLatLng, setLiveLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  // Real-time: join this order's room, get live driver position, chat
  // messages, and status changes pushed from the backend instead of
  // relying purely on the simulated local progress below.
  useEffect(() => {
    const room = `order:${order.id}`;
    joinRoom(room);
    const socket = getSocket();

    const onLocation = (payload: { orderId: string; lat: number; lng: number }) => {
      if (payload.orderId === order.id) setLiveLatLng({ lat: payload.lat, lng: payload.lng });
    };
    const onUpdated = (payload: { id: string }) => {
      if (payload.id === order.id) useZoomo.getState().refreshOrders();
    };
    const onMessage = (msg: { id: string; orderId?: string; sender: "CUSTOMER" | "DRIVER"; text: string; createdAt: string }) => {
      // Driver-sent messages arrive here; our own sends already append
      // optimistically via sendRideChat, so skip re-adding those.
      if (msg.sender !== "DRIVER") return;
      useZoomo.setState((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id
            ? { ...o, chat: [...(o.chat ?? []), { id: msg.id, from: "rider" as const, text: msg.text, at: msg.createdAt }] }
            : o,
        ),
      }));
    };

    socket.on("driver:location", onLocation);
    socket.on("order:updated", onUpdated);
    socket.on("order:message", onMessage);

    return () => {
      leaveRoom(room);
      socket.off("driver:location", onLocation);
      socket.off("order:updated", onUpdated);
      socket.off("order:message", onMessage);
    };
  }, [order.id]);

  const status = liveStatus(order);
  const active = status !== "DELIVERED" && status !== "CANCELLED";
  const ride = rideProgress(order);
  const nearby = isNearby(order);
  const eta = etaMinutes(order);
  const progress = liveProgress(order);
  const steps = stepsFor(order.orderType);
  const idx = Math.max(0, steps.findIndex((s) => s.key === status));
  const kitchen = restaurantById(order.restaurantId);
  const finding = riderFinding(order) && status !== "DELIVERED";
  // Prefer the real assigned driver's actual info (name, phone, photo,
  // rating, vehicle) from the backend; only fall back to a mock rider for
  // edge cases where an order has no real driver record at all.
  const rider =
    order.orderType === "DELIVERY" && riderAssigned(status) && !finding
      ? order.driver
        ? { name: order.driver.name, phone: order.driver.phone, bike: order.driver.vehicleType, plate: order.driver.vehiclePlate, rating: order.driver.rating, avatarUrl: order.driver.avatarUrl }
        : riderById(order.driverId) ?? riderFor(order.id)
      : null;
  const dest = order.address?.city || "Jourian";
  const late = Boolean(active && order.promisedAt && Date.now() > new Date(order.promisedAt).getTime());
  const headline = trackHeadline(status, rider?.name.split(" ")[0], nearby);

  useEffect(() => {
    if (late && !order.lateCredit) grantLateCredit(order.id);
  }, [late, order.id, order.lateCredit, grantLateCredit]);

  useEffect(() => {
    if (status === "DELIVERED" && !order.proofAt) setProof(order.id);
  }, [status, order.id, order.proofAt, setProof]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [order.chat, chatOpen]);

  function ping(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 1800);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Track ${order.restaurantName}`, url });
      else {
        await navigator.clipboard.writeText(url);
        ping("Tracking link copied");
      }
    } catch {
      await navigator.clipboard.writeText(url);
      ping("Tracking link copied");
    }
  }

  const drop = DROP_OFF.find((d) => d.id === (order.dropOff || "MEET_DOOR"));

  return (
    <div className="fixed inset-0 z-40 bg-[#d7e6de]">
      <div className={`absolute inset-x-0 top-0 ${sheet === "full" ? "bottom-[72%]" : "bottom-[42%]"}`}>
        <LiveRideMap
          from={kitchen?.area || "Jourian"}
          to={dest}
          ride={status === "CANCELLED" ? 0 : ride}
          showRider={Boolean(rider) && status !== "CANCELLED"}
          nearby={nearby}
          liveLatLng={status !== "CANCELLED" ? liveLatLng : null}
        />
      </div>

      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={back}
          className="flex size-11 items-center justify-center rounded-full bg-white shadow-lift"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-ink shadow-sm">
          {eta === 0 ? (status === "DELIVERED" ? "Delivered" : "Now") : `${eta} min`}
          {order.promisedAt && active ? ` · ${gateBy(0, new Date(order.promisedAt).getTime())}` : ""}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={share} className="flex size-11 items-center justify-center rounded-full bg-white shadow-lift" aria-label="Share">
            <Share2 className="size-4" />
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="flex size-11 items-center justify-center rounded-full bg-white shadow-lift" aria-label="Help">
            <HelpCircle className="size-4" />
          </button>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-[28px] bg-surface shadow-lift transition-[height] duration-300 ${
          sheet === "full" ? "h-[72%]" : "h-[42%]"
        }`}
      >
        <button type="button" onClick={() => setSheet((s) => (s === "full" ? "mini" : "full"))} className="flex w-full flex-col items-center pt-2 pb-1" aria-label="Expand tracking">
          <span className="h-1.5 w-10 rounded-full bg-line" />
          {sheet === "full" ? <ChevronDown className="mt-1 size-4 text-muted" /> : <ChevronUp className="mt-1 size-4 text-muted" />}
        </button>

        <div className="h-[calc(100%-28px)] overflow-y-auto px-5 pb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{order.restaurantName}</p>
              <h1 className="mt-1 text-[22px] font-bold tracking-tight text-ink">{headline}</h1>
              <p className="mt-1 text-sm text-sub">{steps[idx]?.hint}</p>
            </div>
            <StatusPill status={status} />
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <ol className="mt-3 flex gap-1">
            {steps.map((s, i) => (
              <li key={s.key} className="min-w-0 flex-1">
                <span className={`block h-1 rounded-full ${i <= idx ? "bg-primary" : "bg-line"}`} />
                <p className={`mt-1 truncate text-[10px] font-bold ${i === idx ? "text-ink" : "text-muted"}`}>{s.label}</p>
              </li>
            ))}
          </ol>

          {(order.lateCredit || late) && active && (
            <p className="mt-3 rounded-2xl bg-sage px-3 py-2 text-[13px] font-bold text-primary">
              Past the clock. ₹{order.lateCredit || LATE_CREDIT} off this bag.
            </p>
          )}

          {finding && (
            <p className="mt-4 rounded-2xl bg-sage px-4 py-3 text-[13px] font-bold text-primary">Finding a rider nearby…</p>
          )}

          {rider && (
            <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-page p-3">
              <img
                src={
                  (rider as { avatarUrl?: string }).avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(rider.name)}&background=0F3D2D&color=fff&size=96`
                }
                alt=""
                className="size-14 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">{rider.name}</p>
                <p className="text-xs text-sub">
                  {rider.bike} · {rider.plate}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-ink">
                  <Star className="size-3 fill-primary text-primary" /> {rider.rating}
                </p>
              </div>
              {active && (
                <div className="flex gap-2">
                  <a href={`tel:+91${rider.phone}`} className="flex size-11 items-center justify-center rounded-full bg-primary text-white" aria-label="Call rider">
                    <Phone className="size-4" />
                  </a>
                  <button type="button" onClick={() => setChatOpen(true)} className="flex size-11 items-center justify-center rounded-full border border-line bg-surface" aria-label="Message">
                    <MessageCircle className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {active && (
            <button
              type="button"
              onClick={() => setDropOpen(true)}
              className="mt-3 flex w-full items-center justify-between rounded-[22px] bg-page px-4 py-3 text-left"
            >
              <span>
                <span className="block text-[11px] font-bold tracking-wide text-muted uppercase">Drop-off</span>
                <span className="text-sm font-bold text-ink">{drop?.label}</span>
                {order.dropNote && <span className="block text-xs text-sub">{order.dropNote}</span>}
              </span>
              <span className="text-xs font-bold text-primary">Change</span>
            </button>
          )}

          {order.address && (
            <p className="mt-3 text-[13px] text-sub">
              <span className="font-bold text-ink">Deliver to </span>
              {order.address.street}, {order.address.city}
            </p>
          )}

          {sheet === "full" && (
            <>
              <div className="mt-5 border-t border-line-soft pt-4">
                <p className="mb-2 text-[13px] font-bold text-ink">Items</p>
                {order.items.map((i) => (
                  <div key={i.dishId} className="mb-2 flex justify-between text-sm">
                    <span className="text-sub">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="font-semibold text-ink">{inr(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-line-soft pt-2 text-[15px] font-bold">
                  <span>Total</span>
                  <span>{inr(order.total)}</span>
                </div>
              </div>
              {kitchen?.phone && active && (
                <a href={`tel:+91${kitchen.phone}`} className="btn-ghost mt-4 flex h-11 w-full items-center justify-center gap-2 text-sm">
                  <UtensilsCrossed className="size-4" /> Call {kitchen.name}
                </a>
              )}
              {active && (
                <button
                  type="button"
                  onClick={() => {
                    pingGate(order.id);
                    ping("Rider pinged — you’re at the gate");
                  }}
                  className="btn-ghost mt-2 h-11 w-full text-sm"
                >
                  {order.gatePingAt ? "Pinged · I’m at the gate" : "I’m at the gate"}
                </button>
              )}
              {status === "DELIVERED" && (
                <>
                  {order.proofAt && (
                    <div className="mt-4 overflow-hidden rounded-[22px] bg-page">
                      <img src={order.items[0]?.imageUrl || IMG.burger} alt="" className="h-36 w-full object-cover" />
                      <p className="px-3 py-2 text-[12px] font-bold text-sub">Left at your gate · proof</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <p className="mb-2 text-[13px] font-bold text-ink">Rate {rider?.name.split(" ")[0] || "the drop"}</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => rateOrder(order.id, n)} aria-label={`${n} stars`}>
                          <Star className={`size-7 ${n <= (order.rating || 0) ? "fill-primary text-primary" : "text-line"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (reorder(order.id) === "ok") nav({ to: "/cart" });
                    }}
                    className="btn-primary mt-4 h-12 w-full text-sm"
                  >
                    Order again
                  </button>
                </>
              )}
              {active && (
                <button type="button" onClick={() => setConfirmCancel(true)} className="mt-4 w-full py-3 text-sm font-bold text-danger">
                  Cancel order
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {chatOpen && rider && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat">
              <X className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{rider.name}</p>
              <p className="text-[11px] text-muted">Usually replies in a minute</p>
            </div>
            <a href={`tel:+91${rider.phone}`} className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
              <Phone className="size-4" />
            </a>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-page p-4">
            {(order.chat ?? []).map((m) => (
              <div key={m.id} className={m.from === "me" ? "ml-auto max-w-[80%]" : "max-w-[80%]"}>
                <p className={`rounded-2xl px-3 py-2 text-[13px] ${m.from === "me" ? "bg-primary text-white" : "bg-surface text-ink shadow-sm"}`}>
                  {m.text}
                </p>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendRideChat(order.id, note);
              setNote("");
            }}
          >
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="I’m at the gate…" className="field !pl-4 flex-1" />
            <button type="submit" className="btn-primary h-12 px-4 text-sm">
              Send
            </button>
          </form>
        </div>
      )}

      {dropOpen && (
        <Sheet onClose={() => setDropOpen(false)} title="Drop-off">
          {DROP_OFF.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDropOff(order.id, d.id);
                setDropOpen(false);
              }}
              className={`mb-2 w-full rounded-2xl px-4 py-3 text-left ${
                (order.dropOff || "MEET_DOOR") === d.id ? "bg-sage" : "bg-page"
              }`}
            >
              <p className="text-sm font-bold text-ink">{d.label}</p>
              <p className="text-xs text-sub">{d.hint}</p>
            </button>
          ))}
        </Sheet>
      )}

      {helpOpen && (
        <Sheet onClose={() => setHelpOpen(false)} title="Help">
          {[
            ["Missing item", "We’ll ping the kitchen."],
            ["Wrong order", "Show us a photo after drop."],
            ["It’s late", "Clock credit applies automatically."],
            ["Rider issue", "Call or message them from this screen."],
          ].map(([t, h]) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setHelpOpen(false);
                ping("Logged. We’ll look into it.");
              }}
              className="mb-2 w-full rounded-2xl bg-page px-4 py-3 text-left"
            >
              <p className="text-sm font-bold text-ink">{t}</p>
              <p className="text-xs text-sub">{h}</p>
            </button>
          ))}
        </Sheet>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-lift">
            <h3 className="text-[17px] font-bold text-ink">Cancel this bag?</h3>
            <p className="mt-2 text-sm text-sub">
              {status === "OUTFORDELIVERY" ? "Rider already has it. We’ll still try to stop the drop." : "Kitchen will stop cooking this one."}
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmCancel(false)} className="btn-ghost flex-1 py-3 text-sm">
                Keep it
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelOrder(order.id);
                  setConfirmCancel(false);
                }}
                className="flex-1 rounded-xl bg-danger py-3 text-sm font-bold text-white"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[46%] z-[90] flex justify-center px-4">
          <p className="rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-lift">{toast}</p>
        </div>
      )}
    </div>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-[28px] bg-surface p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
