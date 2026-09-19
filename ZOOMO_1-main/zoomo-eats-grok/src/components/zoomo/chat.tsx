import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Coffee, Heart, MessageCircle, Moon, Send, Sparkles, Tag, UtensilsCrossed, X } from "lucide-react";
import { COUPONS, DISHES, etaMinutes, liveStatus, restaurantById, type Dish } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

type Card =
  | { kind: "kitchen"; id: string; name: string; meta: string; image: string }
  | { kind: "dish"; id: string; restaurantId: string; name: string; meta: string; image: string }
  | { kind: "coupon"; code: string; label: string }
  | { kind: "order"; id: string; name: string; status: string; eta: number };

type Msg = { role: "bot" | "user"; text: string; cards?: Card[] };

function dishCards(list: Dish[], limit = 3): Card[] {
  return list.slice(0, limit).map((d) => {
    const r = restaurantById(d.restaurantId);
    return {
      kind: "dish" as const,
      id: d.id,
      restaurantId: d.restaurantId,
      name: d.name,
      meta: `${r?.name ?? ""} · ₹${d.price}`,
      image: d.imageUrl,
    };
  });
}

function replyFor(text: string): Msg {
  const h = text.toLowerCase();
  const { orders, cart, user, visits, location, activatedOffers } = useZoomo.getState();
  const latest = orders[0];
  const veg = Boolean(user?.vegOnly);
  const pool = DISHES.filter((d) => !veg || d.isVegetarian);

  if (/(track|order|where)/.test(h)) {
    if (!latest) {
      return { role: "bot", text: "No live orders yet. Pick a restaurant and I’ll track the order the second it leaves." };
    }
    const st = liveStatus(latest);
    const eta = etaMinutes(latest);
    return {
      role: "bot",
      text: `${latest.restaurantName} has your bag — ${st.toLowerCase().replaceAll("_", " ")}.`,
      cards: [{ kind: "order", id: latest.id, name: latest.restaurantName, status: st, eta }],
    };
  }
  if (/(deal|offer|coupon|promo|code)/.test(h)) {
    return {
      role: "bot",
      text: activatedOffers?.[0] ? `${activatedOffers[0]} is on. It applies at checkout.` : "Tap an offer — one at a time, applied at checkout.",
      cards: Object.entries(COUPONS).slice(0, 4).map(([code, v]) => ({ kind: "coupon", code, label: v.label })),
    };
  }
  if (/(spicy|peri|chilli|hot|tikka)/.test(h)) {
    const list = pool.filter((d) => /peri|chilli|tikka|tandoori|manchurian|masala/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Spicy mood. These hold up in Jourian heat.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(sweet|dessert|chocolate|shake|ice cream|brownie)/.test(h)) {
    const list = pool.filter((d) => /shake|brownie|chocolate|gulab|ice cream|kitkat|oreo|dessert|lava|cup cake/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Sweet tooth. Tap one and I’ll drop it in the bag.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(comfort|rain|cozy|maggie|pasta|soup)/.test(h)) {
    const list = pool.filter((d) => /maggie|pasta|pizza|soup|chai|garlic bread/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Comfort food. Warm, simple, Jourian-close.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(late|night|insomnia|can't sleep)/.test(h)) {
    const list = pool.filter((d) => /coffee|chai|fries|momos|shake|burger/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Late-night food. These restaurants are still open.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(healthy|salad|light|green tea|diet)/.test(h)) {
    const list = pool.filter((d) => /salad|green tea|makhane|corn|lassi|lemonade/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Lighter picks — still a proper bag.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(coffee|chai|caffeine|wake)/.test(h)) {
    const list = pool.filter((d) => /coffee|chai|latte|espresso|tea|frappe/i.test(`${d.name} ${d.category}`));
    return { role: "bot", text: "Caffeine first. Tap a cup.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(hungry|eat|food|craving|recommend|menu|find food)/.test(h)) {
    const list = pool.filter((d) => /pizza|burger|fries|momos/i.test(d.name));
    return { role: "bot", text: "Hungry. Start with these — tap one and I’ll open the restaurant with it in your bag.", cards: dishCards(list.length ? list : pool) };
  }
  if (/(pay|upi|card|cash)/.test(h)) {
    return { role: "bot", text: "Checkout takes UPI, cards, wallets, net banking, or cash on delivery." };
  }
  if (/(deliver|city|location|jourian|area)/.test(h)) {
    return {
      role: "bot",
      text: location
        ? `We’re only in Jourian tehsil. Routing to ${location}.`
        : "Jourian town and nearby mohallas. Set your drop-off at checkout.",
    };
  }
  if (/(veg|vegetarian)/.test(h)) {
    return { role: "bot", text: user?.vegOnly ? "Veg mode is on in Profile." : "Turn on Veg mode in Profile and menus filter themselves." };
  }
  if (/(point|loyalty|reward|regular|stamp)/.test(h)) {
    const n = Object.values(visits ?? {}).filter((v) => v >= 3).length;
    return { role: "bot", text: n ? `You’re a regular at ${n} restaurant${n === 1 ? "" : "s"}.` : "Three orders at a restaurant and you’re a regular. Fifth order is free." };
  }
  if (/(cart|bag)/.test(h)) {
    const n = cart.reduce((s, i) => s + i.quantity, 0);
    return { role: "bot", text: n ? `${n} item${n === 1 ? "" : "s"} in the bag. Checkout one restaurant at a time.` : "Bag’s empty. Pizza, fries, or a shake?" };
  }
  if (/(help|support|human)/.test(h)) {
    return { role: "bot", text: "I can find food by mood, apply a deal, or track a bag. For a refund, open the delivered order." };
  }
  return { role: "bot", text: "Tell me the mood — hungry, spicy, sweet, comfort, late night — or tap a chip below." };
}

export function ZoomoChat({ hideFab = false }: { hideFab?: boolean }) {
  const nav = useNavigate();
  const { cart, orders, toggleOffer, user, addToCart } = useZoomo();
  const [open, setOpen] = useState(false);
  const [overFooter, setOverFooter] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hey — what’s the mood? Hungry, spicy, sweet, or a late coffee." },
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0);
  const live = orders.find((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });

  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("zoomo:open-chat", open);
    return () => window.removeEventListener("zoomo:open-chat", open);
  }, []);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, typing]);

  useEffect(() => {
    const footer = document.querySelector("[data-zoomo-footer]");
    if (!footer) return;
    const check = () => {
      const fab = fabRef.current;
      if (!fab) {
        setOverFooter(false);
        return;
      }
      const f = footer.getBoundingClientRect();
      const b = fab.getBoundingClientRect();
      const overlap = b.bottom > f.top + 2 && b.top < f.bottom - 2 && b.right > f.left && b.left < f.right;
      setOverFooter(overlap);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [open, cartCount]);

  function send(raw = input) {
    const p = raw.trim();
    if (!p) return;
    setMsgs((m) => [...m, { role: "user", text: p }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, replyFor(p)]);
      setTyping(false);
    }, 420 + Math.random() * 360);
  }

  const slot = "right-3 bottom-24 md:right-5 md:bottom-6";

  const chips = [
    { t: "Hungry", i: UtensilsCrossed },
    { t: "Spicy", i: Sparkles },
    { t: "Sweet", i: Heart },
    { t: "Comfort", i: Coffee },
    { t: "Late night", i: Moon },
    { t: "Deals", i: Tag },
  ];

  if (!open) {
    if (hideFab) return null;
    return (
      <button
        ref={fabRef}
        title="Chat with Zoomo"
        onClick={() => setOpen(true)}
        className={`fixed z-[60] flex size-[52px] items-center justify-center rounded-full shadow-lift transition-colors duration-200 ${slot} ${
          overFooter ? "bg-white text-primary ring-2 ring-primary/15" : "bg-primary text-white"
        }`}
        aria-label="Chat"
      >
        <MessageCircle className="size-5" />
        <span className={`absolute top-1 right-1 size-2 rounded-full ring-2 ${overFooter ? "bg-primary ring-white" : "bg-accent ring-white"}`} />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[90] flex h-[min(560px,72dvh)] flex-col overflow-hidden rounded-[28px] bg-surface shadow-lift max-md:inset-x-3 max-md:bottom-[5.5rem] max-md:w-auto md:right-5 md:bottom-6 md:w-[360px] ${cartCount > 0 ? "max-md:bottom-[6.25rem]" : ""}`}
    >
      <div className="flex items-center justify-between bg-primary px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/brand/mark-on-white.png" alt="" className="size-9 shrink-0 rounded-[10px] bg-white object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">Zoomo Assist</p>
            <p className="truncate text-[11px] text-white/60">Jourian · food by mood</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/80" aria-label="Close chat">
          <X className="size-4" />
        </button>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-page p-3">
        {live && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              nav({ to: "/orders/$id", params: { id: live.id } });
            }}
            className="w-full rounded-2xl bg-sage px-3 py-2.5 text-left"
          >
            <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">Live bag</p>
            <p className="truncate text-[13px] font-bold text-ink">{live.restaurantName}</p>
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
                  if (c.kind === "dish") {
                    const dish = DISHES.find((d) => d.id === c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (!user) {
                            setOpen(false);
                            nav({ to: "/login" });
                            return;
                          }
                          if (dish) addToCart(dish, dish.sizes?.[0]?.id);
                          setOpen(false);
                          nav({ to: "/restaurant/$id", params: { id: c.restaurantId } });
                        }}
                        className="flex w-full items-center gap-2.5 overflow-hidden rounded-2xl bg-surface text-left shadow-sm"
                      >
                        <img src={c.image} alt="" className="h-14 w-16 shrink-0 object-cover" />
                        <span className="min-w-0 py-2 pr-3">
                          <span className="block truncate text-[13px] font-bold text-ink">{c.name}</span>
                          <span className="block truncate text-[11px] text-muted">{c.meta}</span>
                        </span>
                      </button>
                    );
                  }
                  if (c.kind === "kitchen") {
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          nav({ to: "/restaurant/$id", params: { id: c.id } });
                        }}
                        className="flex w-full items-center gap-2.5 overflow-hidden rounded-2xl bg-surface text-left shadow-sm"
                      >
                        <img src={c.image} alt="" className="h-14 w-16 shrink-0 object-cover" />
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
                        type="button"
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
                              text: res === "on" ? `${c.code} will apply at checkout.` : `${c.code} removed.`,
                            },
                          ]);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2.5 text-left shadow-sm"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-bold text-ink">{c.code}</span>
                          <span className="block truncate text-[11px] text-muted">{c.label}</span>
                        </span>
                        <Tag className="size-4 shrink-0 text-primary" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        nav({ to: "/orders/$id", params: { id: c.id } });
                      }}
                      className="w-full rounded-2xl bg-surface px-3 py-2.5 text-left shadow-sm"
                    >
                      <p className="truncate text-[13px] font-bold text-ink">{c.name}</p>
                      <p className="truncate text-[11px] text-muted">{c.status.replaceAll("_", " ")}</p>
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

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-line-soft bg-surface px-3 py-2">
        {chips.map((c) => (
          <button
            key={c.t}
            type="button"
            onClick={() => send(c.t)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-page px-3 text-[11px] font-semibold text-sub"
          >
            <c.i className="size-3 shrink-0" /> {c.t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line-soft p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What’s the mood?"
          className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-line px-3 text-[13px] outline-none focus:border-primary"
        />
        <button type="button" onClick={() => send()} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white" aria-label="Send">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
