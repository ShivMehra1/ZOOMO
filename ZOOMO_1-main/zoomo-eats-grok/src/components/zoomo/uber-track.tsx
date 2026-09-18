import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { StatusPill } from "./tracker";
import { JourianMap } from "./zone-map";
import { formatWhen } from "@/lib/when";
import { getSocket, joinRoom, leaveRoom } from "@/lib/socket";
import {
  DROP_OFF,
  LATE_CREDIT,
  etaMinOf,
  etaMinutes,
  inr,
  liveStatus,
  restaurantById,
  riderAssigned,
  riderById,
  riderFinding,
  riderFor,
  stepsFor,
} from "@/lib/zoomo-data";
import { useZoomo, type Order } from "@/lib/zoomo-store";
import { PostDeliveryCard } from "./post-delivery";

export function UberTrack({ order }: { order: Order }) {
  const nav = useNavigate();
  const {
    cancelOrder,
    grantLateCredit,
    setDropOff,
    sendRideChat,
    reorder,
    refreshOrders,
  } = useZoomo();
  const [chatOpen, setChatOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const leaving = useRef(false);

  function leaveTrack() {
    if (leaving.current) return;
    leaving.current = true;
    nav({ to: "/", replace: true });
  }

  useEffect(() => {
    const room = `order:${order.id}`;
    joinRoom(room);
    const socket = getSocket();
    const onUpdated = (payload: { id: string }) => {
      if (payload.id === order.id) refreshOrders();
    };
    const onMessage = (msg: { id: string; sender: "CUSTOMER" | "DRIVER"; text: string; createdAt: string }) => {
      if (msg.sender !== "DRIVER") return;
      useZoomo.setState((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id
            ? { ...o, chat: [...(o.chat ?? []), { id: msg.id, from: "rider" as const, text: msg.text, at: msg.createdAt }] }
            : o,
        ),
      }));
    };
    socket.on("order:updated", onUpdated);
    socket.on("order:message", onMessage);
    const poll = setInterval(() => refreshOrders(), 8000);
    return () => {
      leaveRoom(room);
      socket.off("order:updated", onUpdated);
      socket.off("order:message", onMessage);
      clearInterval(poll);
    };
  }, [order.id, refreshOrders]);

  const status = liveStatus(order);
  const active = status !== "DELIVERED" && status !== "CANCELLED";
  const steps = stepsFor(order.orderType);
  const idx = Math.max(0, steps.findIndex((s) => s.key === status));
  const kitchen = restaurantById(order.restaurantId);
  const mins = etaMinOf(kitchen) || etaMinutes(order) || 22;
  const kitchenName = kitchen?.name || order.restaurantName;
  const statusLine =
    status === "DELIVERED"
      ? `${kitchenName} already delivered this.`
      : status === "CANCELLED"
        ? "This order was cancelled."
        : status === "OUTFORDELIVERY"
          ? `${kitchenName} sent your bag out.`
          : status === "PREPARING"
            ? `${kitchenName} is cooking your order.`
            : status === "READYFORPICKUP"
              ? `${kitchenName} has packed your order.`
              : `${kitchenName} has your order.`;
  const awayLine =
    active ? (status === "OUTFORDELIVERY" ? `Your food is ${mins} minutes away` : `Your food is about ${mins} minutes away`) : null;
  const finding = riderFinding(order) && status !== "DELIVERED";
  const rider =
    order.orderType === "DELIVERY" && riderAssigned(status) && !finding
      ? order.driver
        ? { name: order.driver.name, phone: order.driver.phone, bike: order.driver.vehicleType, plate: order.driver.vehiclePlate, rating: order.driver.rating, avatarUrl: order.driver.avatarUrl }
        : riderById(order.driverId) ?? riderFor(order.id)
      : null;
  const late = Boolean(active && order.promisedAt && Date.now() > new Date(order.promisedAt).getTime());
  const drop = DROP_OFF.find((d) => d.id === (order.dropOff || "MEET_DOOR"));

  useEffect(() => {
    if (late && !order.lateCredit) grantLateCredit(order.id);
  }, [late, order.id, order.lateCredit, grantLateCredit]);

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

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1612]">
      <JourianMap
        area={order.address?.city || kitchen?.area || "Jourian"}
        title="Jourian tracking map"
        className="absolute inset-0 size-full border-0"
      />
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-ink/50 to-transparent pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={leaveTrack}
            className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-card"
            aria-label="Back home"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={share} className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-card" aria-label="Share">
              <Share2 className="size-4" />
            </button>
            <button type="button" onClick={() => setHelpOpen(true)} className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-card" aria-label="Help">
              <HelpCircle className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[62vh] space-y-3 overflow-y-auto rounded-t-[28px] bg-white px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lift sm:px-5">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
        <div>
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">{kitchenName}</p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[26px]">{statusLine}</h1>
          {awayLine && (
            <p className="mt-2 text-[16px] font-semibold text-primary">{awayLine}</p>
          )}
          <p className="mt-1 text-[12px] text-muted">Placed {formatWhen(order.createdAt)}</p>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="grid grid-cols-2 gap-2 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Items</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{order.items.reduce((s, i) => s + i.quantity, 0)} in bag</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Drop-off</p>
              <p className="mt-0.5 truncate text-sm font-bold text-ink">{order.address?.street || order.address?.city || "Pickup"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-ink">{steps[idx]?.label || "Status"}</p>
            <StatusPill status={status} />
          </div>
          <ol>
            {steps.map((s, i) => {
              const filled = i <= idx || status === "DELIVERED";
              const current = i === idx && active;
              const last = i === steps.length - 1;
              return (
                <li key={s.key} className="flex gap-3">
                  <div className="flex w-3 shrink-0 flex-col items-center self-stretch">
                    <span className={`size-2.5 shrink-0 rounded-full ${filled ? "bg-primary" : "bg-line"}`} />
                    {!last && <span className={`mt-1 w-0.5 flex-1 ${i < idx || status === "DELIVERED" ? "bg-primary" : "bg-line"}`} />}
                  </div>
                  <div className={`pb-4 ${last ? "pb-0" : ""}`}>
                    <p className={`text-sm font-bold ${current || filled ? "text-ink" : "text-muted"}`}>{s.label}</p>
                    {(current || filled) && <p className="text-[12px] text-sub">{s.hint}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {(order.lateCredit || late) && active && (
          <p className="rounded-[22px] border border-line bg-white px-4 py-3 text-[13px] font-bold text-ink">
            Running late — ₹{order.lateCredit || LATE_CREDIT} off this bag.
          </p>
        )}

        {finding && (
          <p className="rounded-[22px] border border-line bg-white px-4 py-3 text-[13px] font-bold text-ink">Finding a nearby driver…</p>
        )}

        {rider && (
          <div className="flex items-center gap-3 rounded-[24px] border border-line bg-white p-4">
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
              <p className="text-xs text-sub">{rider.bike} · {rider.plate}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-ink">
                <Star className="size-3 fill-primary text-primary" /> {rider.rating}
              </p>
            </div>
            {active && (
              <div className="flex gap-2">
                <a href={`tel:+91${rider.phone}`} className="flex size-11 items-center justify-center rounded-full bg-primary text-white" aria-label="Call driver">
                  <Phone className="size-4" />
                </a>
                <button type="button" onClick={() => setChatOpen(true)} className="flex size-11 items-center justify-center rounded-full border border-line bg-page" aria-label="Message">
                  <MessageCircle className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {order.address && (
          <div className="rounded-[24px] border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
              <MapPin className="size-3.5" /> Deliver to
            </p>
            <p className="mt-1 text-sm font-bold text-ink">{order.address.street}, {order.address.city}</p>
            {active && (
              <button type="button" onClick={() => setDropOpen(true)} className="mt-2 text-xs font-bold text-primary">
                {drop?.label || "Meet at door"} · Change
              </button>
            )}
          </div>
        )}

        <div className="rounded-[24px] border border-line bg-white p-5">
          <p className="mb-3 text-[13px] font-bold text-ink">Bill</p>
          {order.items.map((i) => (
            <div key={i.dishId} className="mb-2 flex justify-between text-sm">
              <span className="text-sub">{i.name} × {i.quantity}</span>
              <span className="font-semibold text-ink tabular">{inr(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="mt-3 space-y-1.5 border-t border-line-soft pt-3 text-[13px] text-sub">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="tabular">{inr(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular">{order.deliveryFee > 0 ? inr(order.deliveryFee) : "FREE"}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="tabular">{inr(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-veg">
                <span>Promo</span>
                <span className="tabular">−{inr(order.discount)}</span>
              </div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-primary">
                <span>Tip</span>
                <span className="tabular">{inr(order.tip)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-line-soft pt-3 text-[16px] font-bold text-ink">
            <span>Total</span>
            <span className="tabular text-primary">{inr(order.total)}</span>
          </div>
        </div>

        {kitchen?.phone && active && (
          <a href={`tel:+91${kitchen.phone}`} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white">
            <UtensilsCrossed className="size-4" /> Call {kitchen.name}
          </a>
        )}

        {status === "DELIVERED" && (
          <>
            <PostDeliveryCard order={order} />
            <button
              type="button"
              onClick={() => {
                if (reorder(order.id) === "ok") nav({ to: "/cart" });
              }}
              className="btn-primary h-12 w-full text-sm"
            >
              Order again
            </button>
          </>
        )}

        {active && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="w-full py-3 text-sm font-bold text-danger">
            Cancel order
          </button>
        )}
      </div>

      {chatOpen && rider && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat"><X className="size-5" /></button>
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
                <p className={`rounded-2xl px-3 py-2 text-[13px] ${m.from === "me" ? "bg-primary text-white" : "bg-surface text-ink shadow-sm"}`}>{m.text}</p>
              </div>
            ))}
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
            <button type="submit" className="btn-primary h-12 px-4 text-sm">Send</button>
          </form>
        </div>
      )}

      {dropOpen && (
        <Sheet onClose={() => setDropOpen(false)} title="Drop-off">
          {DROP_OFF.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => { setDropOff(order.id, d.id); setDropOpen(false); }}
              className={`mb-2 w-full rounded-2xl px-4 py-3 text-left ${(order.dropOff || "MEET_DOOR") === d.id ? "bg-sage" : "bg-page"}`}
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
            ["Missing item", "We’ll ping the restaurant."],
            ["Wrong order", "Show us a photo after drop."],
            ["It’s late", "Clock credit applies automatically."],
            ["Driver issue", "Call or message them from this screen."],
          ].map(([t, h]) => (
            <button key={t} type="button" onClick={() => { setHelpOpen(false); ping("Logged. We’ll look into it."); }} className="mb-2 w-full rounded-2xl bg-page px-4 py-3 text-left">
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
              {status === "OUTFORDELIVERY" ? "The driver already has it. We’ll still try to stop the drop." : "The restaurant will stop cooking this one."}
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmCancel(false)} className="btn-ghost flex-1 py-3 text-sm">Keep it</button>
              <button type="button" onClick={() => { cancelOrder(order.id); setConfirmCancel(false); }} className="flex-1 rounded-xl bg-danger py-3 text-sm font-bold text-white">Cancel order</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[90] flex justify-center px-4">
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
          <button type="button" onClick={onClose} aria-label="Close"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
