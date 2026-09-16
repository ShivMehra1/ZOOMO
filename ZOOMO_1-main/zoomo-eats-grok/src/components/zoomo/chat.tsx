import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, Send, Sparkles, Tag, UtensilsCrossed, X } from "lucide-react";
import { COUPONS, RESTAURANTS, etaMinutes, liveStatus } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

type Card =
  | { kind: "kitchen"; id: string; name: string; meta: string; image: string }
  | { kind: "coupon"; code: string; label: string }
  | { kind: "order"; id: string; name: string; status: string; eta: number };

type Msg = { role: "bot" | "user"; text: string; cards?: Card[] };

function replyFor(text: string): Msg {
  const h = text.toLowerCase();
  const { orders, cart, user, visits, location, activatedOffers } = useZoomo.getState();
  const latest = orders[0];

  if (/(track|order|where)/.test(h)) {
    if (!latest) {
      return { role: "bot", text: "No live orders yet. Pick a restaurant and I’ll track the bag the second it leaves." };
    }
    const st = liveStatus(latest);
    const eta = etaMinutes(latest);
    return {
      role: "bot",
      text: `Order #${latest.id} from ${latest.restaurantName} is ${st.toLowerCase().replaceAll("_", " ")}.`,
      cards: [{ kind: "order", id: latest.id, name: latest.restaurantName, status: st, eta }],
    };
  }
  if (/(deal|offer|coupon|promo|code)/.test(h)) {
    return {
      role: "bot",
      text: activatedOffers?.length
        ? `${activatedOffers.join(", ")} is already on. Tap another code to stack the week.`
        : "Tap a code — it applies at checkout.",
      cards: Object.entries(COUPONS).slice(0, 4).map(([code, v]) => ({ kind: "coupon", code, label: v.label })),
    };
  }
  if (/(restaurant|menu|eat|hungry|recommend|food)/.test(h)) {
    const picks = [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, 3);
    return {
      role: "bot",
      text: "Tonight’s usuals around Jourian. Tap one and I’ll take you in.",
      cards: picks.map((r) => ({
        kind: "kitchen",
        id: r.id,
        name: r.name,
        meta: `${r.area} · ${r.eta} · ${r.rating}`,
        image: r.imageUrl,
      })),
    };
  }
  if (/(pay|upi|card|cash)/.test(h)) {
    return { role: "bot", text: "Checkout takes UPI, cards, wallets, net banking, or cash on delivery. Set a default in Profile." };
  }
  if (/(deliver|city|location|jourian|area|mohalla)/.test(h)) {
    return {
      role: "bot",
      text: location
        ? `We’re only in Jourian tehsil. Routing to ${location}. Change it from the header pin.`
        : "Manchak, Troti, Ghadi, Dadora, Bakore, Indri, Mandiwala, Maira — set your area in the header.",
    };
  }
  if (/(veg|vegetarian)/.test(h)) {
    return {
      role: "bot",
      text: user?.vegOnly
        ? "Veg mode is on — menus hide non-veg. Toggle it in Profile."
        : "Turn on Veg mode in Profile and every menu filters itself.",
    };
  }
  if (/(point|loyalty|reward|regular|stamp)/.test(h)) {
    const n = Object.values(visits ?? {}).filter((v) => v >= 3).length;
    return {
      role: "bot",
      text: n
        ? `You’re a regular at ${n} restaurant${n === 1 ? "" : "s"}. Four bags, the fifth ride is on us.`
        : "No points here — order three times from a restaurant and you’re a regular. The fifth ride is free.",
    };
  }
  if (/(cart|bag)/.test(h)) {
    const n = cart.reduce((s, i) => s + i.quantity, 0);
    const bags = new Set(cart.map((i) => i.restaurantId)).size;
    return {
      role: "bot",
      text: n
        ? `You’ve got ${n} item${n === 1 ? "" : "s"} across ${bags} bag${bags === 1 ? "" : "s"}. Open Cart to checkout one kitchen at a time.`
        : "Bags are empty. Pizza, biryani, or a late brownie?",
    };
  }
  if (/(help|support|human)/.test(h)) {
    return { role: "bot", text: "I can track, drop a coupon, or find a restaurant. For a refund, open the delivered order." };
  }
  return { role: "bot", text: "Try Track, Deals, or Find food — or just tell me what you’re craving." };
}

export function ZoomoChat() {
  const nav = useNavigate();
  const { cart, orders, toggleOffer, user } = useZoomo();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hey — Zoomo, Jourian only. Track a bag, find a restaurant, or grab a code.",
    },
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);
  const live = orders.find((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, typing]);

  function send(raw = input) {
    const p = raw.trim();
    if (!p) return;
    setMsgs((m) => [...m, { role: "user", text: p }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, replyFor(p)]);
      setTyping(false);
    }, 480 + Math.random() * 420);
  }

  const slot = cartCount > 0
    ? "right-3 bottom-[88px] md:right-5 md:bottom-6"
    : "right-3 bottom-24 md:right-5 md:bottom-6";

  if (!open) {
    return (
      <button
        title="Chat with Zoomo"
        onClick={() => setOpen(true)}
        className={`fixed z-[60] flex items-center justify-center rounded-full bg-primary text-white shadow-lift ${slot}`}
        style={{ width: 52, height: 52 }}
        aria-label="Chat"
      >
        <MessageCircle className="size-5" />
        <span className="absolute top-1 right-1 size-2 rounded-full bg-accent ring-2 ring-white" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[60] flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] bg-surface shadow-lift ${slot}`}
    >
      <div className="flex items-center justify-between bg-primary px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <img src="/brand/mark-on-white.png" alt="" className="size-9 rounded-[10px] bg-white object-cover" />
          <div>
            <p className="text-sm font-bold tracking-tight text-white">Zoomo Assist</p>
            <p className="text-[11px] text-white/60">Online · replies in Jourian</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/70 hover:text-white" aria-label="Close chat">
          <X className="size-4" />
        </button>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-page p-3">
        {live && (
          <button
            onClick={() => {
              setOpen(false);
              nav({ to: "/orders/$id", params: { id: live.id } });
            }}
            className="w-full rounded-2xl bg-sage px-3 py-2.5 text-left"
          >
            <p className="text-[10px] font-bold tracking-[0.14em] text-accent uppercase">Live bag</p>
            <p className="text-[13px] font-bold text-ink">{live.restaurantName}</p>
            <p className="text-xs text-sub">
              {liveStatus(live).replaceAll("_", " ")} · {etaMinutes(live)} min
            </p>
          </button>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[92%]"}>
            <div
              className={`rounded-2xl px-3 py-2 text-[13px] leading-5 ${
                m.role === "bot" ? "bg-surface text-ink shadow-sm" : "bg-primary text-white"
              }`}
            >
              {m.text}
            </div>
            {m.cards && (
              <div className="mt-2 space-y-2">
                {m.cards.map((c) => {
                  if (c.kind === "kitchen") {
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setOpen(false);
                          nav({ to: "/restaurant/$id", params: { id: c.id } });
                        }}
                        className="flex w-full items-center gap-2.5 overflow-hidden rounded-2xl bg-surface text-left shadow-sm"
                      >
                        <img src={c.image} alt="" className="h-14 w-16 object-cover" />
                        <span className="min-w-0 py-2 pr-3">
                          <span className="block truncate text-[13px] font-bold text-ink">{c.name}</span>
                          <span className="block truncate text-[11px] text-muted">{c.meta}</span>
                        </span>
                      </button>
                    );
                  }
                  if (c.kind === "coupon") {
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          if (!user) {
                            setOpen(false);
                            nav({ to: "/login" });
                            return;
                          }
                          const res = toggleOffer(c.code);
                          setMsgs((m) => [
                            ...m,
                            {
                              role: "bot",
                              text:
                                res === "full"
                                  ? "Two offers at a time — turn one off first."
                                  : res === "on"
                                    ? `${c.code} is on. It’ll apply at checkout.`
                                    : `${c.code} turned off.`,
                            },
                          ]);
                        }}
                        className="flex w-full items-center justify-between rounded-2xl bg-surface px-3 py-2.5 text-left shadow-sm"
                      >
                        <span>
                          <span className="block text-[13px] font-bold text-ink">{c.code}</span>
                          <span className="text-[11px] text-muted">{c.label}</span>
                        </span>
                        <Tag className="size-4 text-primary" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setOpen(false);
                        nav({ to: "/orders/$id", params: { id: c.id } });
                      }}
                      className="w-full rounded-2xl bg-surface px-3 py-2.5 text-left shadow-sm"
                    >
                      <p className="text-[13px] font-bold text-ink">{c.name}</p>
                      <p className="text-[11px] text-muted">
                        {c.status.replaceAll("_", " ")} · {c.eta > 0 ? `${c.eta} min` : "due now"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 rounded-2xl bg-surface px-3 py-2.5 shadow-sm">
            <span className="size-1.5 animate-bounce rounded-full bg-muted" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
          </div>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-t border-line-soft bg-surface px-3 py-2">
        {[
          { t: "Find food", i: UtensilsCrossed },
          { t: "Deals", i: Tag },
          { t: "Track order", i: Sparkles },
        ].map((c) => (
          <button
            key={c.t}
            onClick={() => send(c.t)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-page px-2.5 py-1 text-[11px] font-medium text-sub"
          >
            <c.i className="size-3" /> {c.t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line-soft p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Zoomo…"
          className="h-10 flex-1 rounded-xl border-[1.5px] border-line px-3 text-[13px] outline-none focus:border-primary"
        />
        <button onClick={() => send()} className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
