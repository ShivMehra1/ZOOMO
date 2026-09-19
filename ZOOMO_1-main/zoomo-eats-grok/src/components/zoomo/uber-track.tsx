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
  X,
} from "lucide-react";
import { JourianMap } from "./zone-map";
import { formatWhen } from "@/lib/when";
import { getSocket, joinRoom, leaveRoom } from "@/lib/socket";
import {
  DROP_OFF,
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
import { ZoomoChat } from "./chat";
import { deliveryPinOf, isCashCollect, payLabel } from "@/lib/pay";

export function UberTrack({ order }: { order: Order }) {
  const nav = useNavigate();
  const {
    cancelOrder,
    setDropOff,
    sendRideChat,
    reorder,
    refreshOrders,
  } = useZoomo();
  const [chatOpen, setChatOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const leaving = useRef(false);
  const chatEnd = useRef<HTMLDivElement>(null);

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
    const onMessage = (msg: { id: string; sender: "CUSTOMER" | "DRIVER" | "RESTAURANT"; text: string; createdAt: string }) => {
      if (msg.sender === "CUSTOMER") return;
      const from = msg.sender === "RESTAURANT" ? ("kitchen" as const) : ("rider" as const);
      useZoomo.setState((state) => ({
        orders: state.orders.map((o) =>
          o.id === order.id
            ? { ...o, chat: [...(o.chat ?? []), { id: msg.id, from, text: msg.text, at: msg.createdAt }] }
            : o,
        ),
      }));
    };
    socket.on("order:updated", onUpdated);
    socket.on("order:message", onMessage);
    const poll = setInterval(() => refreshOrders(), 12000);
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
  const restaurant = restaurantById(order.restaurantId);
  const mins = etaMinOf(restaurant) || etaMinutes(order) || 22;
  const restaurantName = restaurant?.name || order.restaurantName;
  const cash = isCashCollect(order.paymentMethod);
  const pin = deliveryPinOf(order);
  const statusLine =
    status === "DELIVERED"
      ? "Your order has been delivered."
      : status === "CANCELLED"
        ? "This order was cancelled."
        : status === "OUTFORDELIVERY"
          ? "Your driver has the order."
          : status === "PREPARING"
            ? `${restaurantName} is preparing your order.`
            : status === "READYFORPICKUP"
              ? "Packed. Your driver is going to the restaurant."
              : `${restaurantName} has your order.`;
  const awayLine =
    active ? `Your food is about ${mins} minutes away` : null;
  const finding = riderFinding(order) && status !== "DELIVERED";
  const rider =
    order.orderType === "DELIVERY" && riderAssigned(status) && !finding
      ? order.driver
        ? { name: order.driver.name, phone: order.driver.phone, bike: order.driver.vehicleType, plate: order.driver.vehiclePlate, rating: order.driver.rating, avatarUrl: order.driver.avatarUrl }
        : riderById(order.driverId) ?? riderFor(order.id)
      : null;
  const drop = DROP_OFF.find((d) => d.id === (order.dropOff || "MEET_DOOR"));

  useEffect(() => {
    if (status !== "DELIVERED") return;
    const key = `zoomo:review:${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* ignore */
    }
    if (order.rating && (!isDelivery || order.driverRating)) return;
    setReviewOpen(true);
  }, [status, order.id, order.rating, order.driverRating]);

  useEffect(() => {
    if (chatOpen) chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatOpen, order.chat?.length]);

  const isDelivery = order.orderType === "DELIVERY";

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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="relative min-h-[34vh] flex-1">
        <JourianMap cropChrome title="Jourian tracking map" />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-ink/45 to-transparent pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={leaveTrack}
              className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card"
              aria-label="Back home"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={share} className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card" aria-label="Share">
                <Share2 className="size-4" />
              </button>
              <button type="button" onClick={() => setHelpOpen(true)} className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card" aria-label="Help">
                <HelpCircle className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-8 max-h-[62vh] space-y-3 overflow-y-auto rounded-t-[28px] bg-white px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lift sm:px-5">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
        <div>
          <p className="text-[12px] font-bold tracking-[0.16em] text-primary uppercase">{restaurantName}</p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-ink sm:text-[26px]">{statusLine}</h1>
          {awayLine && (
            <p className="mt-2 text-[16px] font-semibold text-primary">{awayLine}</p>
          )}
          <p className="mt-1 text-[12px] text-muted">{formatWhen(order.createdAt)}</p>
        </div>

        <div className="rounded-[24px] border border-line p-5">
          <p className="mb-4 text-[13px] font-bold text-ink">Order status</p>
          <ol>
            {steps.map((s, i) => {
              const filled = i <= idx || status === "DELIVERED";
              const current = i === idx && active;
              const last = i === steps.length - 1;
              return (
                <li key={s.key} className="flex gap-3">
                  <div className="flex w-4 shrink-0 flex-col items-center self-stretch">
                    <span
                      className={`shrink-0 rounded-full ${
                        current ? "size-3.5 bg-primary ring-4 ring-sage" : filled ? "size-2.5 bg-primary" : "size-2.5 bg-line"
                      }`}
                    />
                    {!last && (
                      <span className={`mt-1 w-1 flex-1 rounded-full ${i < idx || status === "DELIVERED" ? "bg-sage" : "bg-line"}`} />
                    )}
                  </div>
                  <div className={`min-w-0 pb-5 ${last ? "pb-0" : ""}`}>
                    <p className={`text-sm font-bold ${current || filled ? "text-ink" : "text-muted"}`}>{s.label}</p>
                    {(current || filled) && <p className="text-[12px] text-sub">{s.hint}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {finding && (
          <div className="rounded-[24px] bg-primary px-4 py-3.5">
            <p className="text-[14px] font-bold text-white">Finding a nearby driver…</p>
            <p className="mt-0.5 text-[12px] text-white/75">We’ll show their name and bike here in a moment.</p>
          </div>
        )}

        {rider && (
          <div className="flex items-center gap-3 rounded-[24px] border border-line p-4">
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
              <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                <a href={`tel:+91${rider.phone}`}>Call</a>
                <span className="text-line">·</span>
                <button type="button" onClick={() => setChatOpen(true)}>Chat</button>
              </div>
            )}
          </div>
        )}

        {order.address && (
          <div className="rounded-[24px] border border-line p-4">
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

        {isDelivery && active && (
          <div className="rounded-[24px] border border-line p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Payment</p>
            <p className="mt-1 text-[16px] font-bold text-ink">{payLabel(order.paymentMethod)}</p>
            {cash ? (
              <p className="mt-2 text-[15px] font-semibold text-primary">Pay the driver {inr(order.total)} in cash</p>
            ) : (
              <>
                <p className="mt-2 text-[15px] font-semibold text-ink">Already paid. Pay the driver ₹0.</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted">Tell this PIN to your driver</p>
                <p className="mt-1 text-[32px] font-bold tracking-[0.28em] text-primary tabular">{pin}</p>
              </>
            )}
          </div>
        )}

        <div className="rounded-[24px] bg-primary p-5 text-white">
          <p className="mb-4 text-[15px] font-bold tracking-wide text-white/85">Bill</p>
          {order.items.map((i) => (
            <div key={i.dishId} className="mb-2.5 flex items-baseline justify-between gap-3 text-[16px]">
              <span className="min-w-0 text-white/80">{i.name} × {i.quantity}</span>
              <span className="shrink-0 font-semibold tabular">{inr(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="mt-4 space-y-2 border-t border-white/20 pt-4 text-[15px] text-white/80">
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
              <div className="flex justify-between">
                <span>Promo</span>
                <span className="tabular">−{inr(order.discount)}</span>
              </div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between">
                <span>Tip</span>
                <span className="tabular">{inr(order.tip)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-white/20 pt-4 text-[20px] font-bold">
            <span>Total</span>
            <span className="tabular">{inr(order.total)}</span>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-white/20 pt-4 text-[15px]">
            <div className="flex justify-between gap-3">
              <span className="text-white/80">Paid with</span>
              <span className="font-semibold text-right">{payLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/80">Pay the driver</span>
              <span className="font-semibold tabular">{cash ? inr(order.total) : "₹0 — already paid"}</span>
            </div>
          </div>
        </div>

        {active && (
          <div className="rounded-[24px] border border-line p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Restaurant</p>
            <p className="mt-1 text-sm font-bold text-ink">{restaurantName}</p>
            <div className="mt-3 flex border-t border-line pt-3 text-sm font-semibold text-primary">
              {restaurant?.phone && (
                <>
                  <a href={`tel:+91${restaurant.phone}`} className="flex-1 text-center">Call</a>
                  <span className="text-line">|</span>
                </>
              )}
              <button type="button" onClick={() => setChatOpen(true)} className="flex-1 text-center">
                Chat
              </button>
            </div>
          </div>
        )}
        {status === "DELIVERED" && (
          <button
            type="button"
            onClick={() => {
              if (reorder(order.id) === "ok") nav({ to: "/cart" });
            }}
            className="btn-primary h-12 w-full text-sm"
          >
            Order again
          </button>
        )}
        {active && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="w-full py-2 text-center text-[13px] font-semibold text-muted">
            Cancel order
          </button>
        )}
        {status === "DELIVERED" && !reviewOpen && <PostDeliveryCard order={order} />}
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat"><X className="size-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">Order chat</p>
              <p className="text-[11px] text-muted">{restaurantName}{rider ? ` · ${rider.name}` : ""}</p>
            </div>
            {rider?.phone && (
              <a href={`tel:+91${rider.phone}`} className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
                <Phone className="size-4" />
              </a>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-page p-4">
            {(order.chat ?? []).map((m) => (
              <div key={m.id} className={m.from === "me" ? "ml-auto max-w-[80%]" : "max-w-[80%]"}>
                {m.from !== "me" && (
                  <p className="mb-0.5 px-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {m.from === "kitchen" ? restaurantName : rider?.name || "Driver"}
                  </p>
                )}
                <p className={`rounded-2xl px-3 py-2 text-[13px] ${m.from === "me" ? "bg-primary text-white" : "bg-surface text-ink shadow-sm"}`}>{m.text}</p>
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
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message restaurant or driver…" className="field !pl-4 flex-1" />
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
            ["Where is my order?", "Status updates here as the restaurant and driver move."],
            ["Need to change the drop-off?", "Use Change on the address card before the driver arrives."],
            ["Food is late", "We’ll message the restaurant. Stay on this screen for updates."],
            ["Wrong or missing item", "Tell us after delivery with a photo if you have one."],
          ].map(([t, h]) => (
            <button key={t} type="button" onClick={() => { setHelpOpen(false); ping("Noted. Chat with Zoomo if you need more."); }} className="mb-2 w-full rounded-2xl bg-page px-4 py-3 text-left">
              <p className="text-sm font-bold text-ink">{t}</p>
              <p className="text-xs text-sub">{h}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setHelpOpen(false);
              window.dispatchEvent(new Event("zoomo:open-chat"));
            }}
            className="btn-primary mb-2 h-12 w-full text-sm"
          >
            Chat with Zoomo
          </button>
          <a
            href="https://wa.me/14377345009"
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-line text-sm font-bold text-primary"
          >
            WhatsApp +1 437-734-5009
          </a>
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

      {reviewOpen && status === "DELIVERED" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-page p-4 pb-8 sm:rounded-[28px]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Rate your order</p>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem(`zoomo:review:${order.id}`, "1");
                  } catch {
                    /* ignore */
                  }
                  setReviewOpen(false);
                }}
                aria-label="Close"
              >
                <X className="size-5 text-muted" />
              </button>
            </div>
            <PostDeliveryCard order={order} />
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[90] flex justify-center px-4">
          <p className="rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-lift">{toast}</p>
        </div>
      )}
      <ZoomoChat hideFab />
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
