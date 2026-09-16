import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Heart, MapPin, Minus, Plus, ShoppingBag, Star, Users, UtensilsCrossed, X } from "lucide-react";
import { ZoomoChat } from "@/components/zoomo/chat";
import { FoodImg } from "@/components/zoomo/food-img";
import { MobileDock } from "@/components/zoomo/dock";
import { dishesFor, etaMinOf, gateBy, IMG, inr, restaurantById, REVIEWS, type Dish } from "@/lib/zoomo-data";
import { useGoBack } from "@/lib/zoomo-nav";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/restaurant/$id")({ component: RestaurantPage });

function RestaurantPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const back = useGoBack("/restaurants");
  const r = restaurantById(id);
  const { cart, addToCart, setQty, user, favorites, toggleFavorite, dishOff = [], group, addGuest, removeGuest, reviews, addReview } = useZoomo();
  const dishes = dishesFor(id).filter((d) => !user?.vegOnly || d.isVegetarian);
  const loved = favorites.includes(id);
  const mine = cart.filter((i) => i.restaurantId === id);
  const count = mine.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = mine.reduce((s, i) => s + i.price * i.quantity, 0);
  const [cat, setCat] = useState("All");
  const [bagOpen, setBagOpen] = useState(true);
  const [forWho, setForWho] = useState("");
  const [guestDraft, setGuestDraft] = useState("");
  const [revStars, setRevStars] = useState(5);
  const [revText, setRevText] = useState("");

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Dish[]>();
    for (const d of dishes) {
      const key = d.category || "Menu";
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(d);
    }
    return order.map((key) => ({ cat: key, items: map.get(key)! }));
  }, [dishes]);

  const shown = cat === "All" ? groups : groups.filter((g) => g.cat === cat);

  if (!r) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="text-center">
          <p className="mb-3 text-lg font-bold text-ink">Restaurant not found</p>
          <button onClick={back} className="text-sm font-semibold text-primary">
            Go back
          </button>
        </div>
      </div>
    );
  }

  function add(d: Dish, size?: string) {
    if (dishOff.includes(d.id)) return;
    const res = addToCart(d, size, forWho || undefined);
    if (res === "login") nav({ to: "/login" });
    else setBagOpen(true);
  }

  function lineOf(d: Dish, size?: string) {
    return `${d.id}${size ? `__${size}` : ""}${forWho ? `__p_${forWho}` : ""}`;
  }

  return (
    <div className={`min-h-screen bg-page md:pb-28 ${count > 0 ? "pb-52" : "pb-36"}`}>
      <div className="relative h-60 overflow-hidden">
        <FoodImg src={r.imageUrl || IMG.restaurantFallback} alt={r.name} className="size-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(11,15,14,0.85) 0%, rgba(11,15,14,0.2) 60%, rgba(11,15,14,0.35) 100%)",
          }}
        />
        <button
          type="button"
          onClick={back}
          className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        {user && (
          <button
            onClick={() => toggleFavorite(id)}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm"
            aria-label="Favourite"
          >
            <Heart className={`size-4 ${loved ? "fill-primary text-primary" : ""}`} />
          </button>
        )}
        <div className="absolute right-5 bottom-5 left-5">
          <h1 className="display text-[28px] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.3)]">{r.name}</h1>
          <div className="mt-1.5 flex items-center gap-3.5 text-[13px] text-white/85">
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-accent text-accent" /> {r.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {r.eta} · by {gateBy(etaMinOf(r))}
            </span>
            <span>{r.cuisineType || "Various"}</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {r.area}
            </span>
          </div>
        </div>
      </div>

      {r.phone && (
        <div className="mx-auto max-w-[920px] px-5 pt-4">
          <a href={`tel:+91${r.phone}`} className="btn-ghost flex h-11 w-full items-center justify-center gap-2 text-sm">
            Call shop
          </a>
        </div>
      )}

      <div className="mx-auto max-w-[920px] px-5 pt-4">
        <div className="rounded-[22px] bg-surface p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <p className="text-[13px] font-bold text-ink">Group order</p>
            <p className="text-[11px] text-muted">Add for each person, one bag.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setForWho("")}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${forWho === "" ? "bg-primary text-white" : "bg-sage text-primary"}`}
            >
              You
            </button>
            {group.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForWho(g)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                  forWho === g ? "bg-primary text-white" : "bg-sage text-primary"
                }`}
              >
                {g}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (forWho === g) setForWho("");
                    removeGuest(g);
                  }}
                  className="ml-0.5 opacity-70"
                  aria-label={`Remove ${g}`}
                >
                  <X className="size-3" />
                </span>
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = guestDraft.trim();
              if (!n) return;
              addGuest(n);
              setForWho(n);
              setGuestDraft("");
            }}
          >
            <input
              value={guestDraft}
              onChange={(e) => setGuestDraft(e.target.value)}
              placeholder="Add a name"
              className="h-10 flex-1 rounded-xl border-[1.5px] border-line bg-page px-3 text-sm"
            />
            <button type="submit" className="rounded-xl bg-sage px-3 text-[12px] font-bold text-primary">
              Add
            </button>
          </form>
          {forWho && <p className="mt-2 text-[11px] text-sub">Adding to {forWho}’s pile.</p>}
        </div>
      </div>

      {groups.length > 1 && (
        <div className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-md">
          <div className="no-scrollbar mx-auto flex max-w-[920px] gap-2 overflow-x-auto px-5 py-3">
            {["All", ...groups.map((g) => g.cat)].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                  cat === c ? "bg-primary text-white" : "bg-page text-sub"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[920px] px-5 py-7">
        {dishes.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-sage text-primary">
              <UtensilsCrossed className="size-6" />
            </div>
            <p className="text-sub">No dishes available right now</p>
          </div>
        ) : (
          shown.map((g) => (
            <section key={g.cat} className="mb-8">
              <h2 className="display mb-4 text-[20px] text-ink">{g.cat}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {g.items.map((w) => {
                  const q = cart.find((i) => i.dishId === lineOf(w))?.quantity ?? 0;
                  const sized = Boolean(w.sizes?.length);
                  const off = dishOff.includes(w.id);
                  return (
                    <div key={w.id} className={`flex items-start gap-3.5 rounded-[22px] bg-surface p-4 shadow-card ${off ? "opacity-55" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <div
                          className="mb-1.5 flex size-3.5 items-center justify-center rounded-[3px] border-2"
                          style={{ borderColor: w.isVegetarian ? "#16A34A" : "#DC2626" }}
                        >
                          <div className="size-1.5 rounded-full" style={{ background: w.isVegetarian ? "#16A34A" : "#DC2626" }} />
                        </div>
                        <h3 className="text-sm font-bold tracking-[-0.02em] text-ink">{w.name}</h3>
                        {off && <p className="text-[11px] font-bold text-danger">Sold out</p>}
                        {!sized && <p className="mt-0.5 text-sm font-bold text-primary tabular">{inr(w.price)}</p>}
                        {w.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted">{w.description}</p>
                        )}
                        {sized ? (
                          <div className="mt-3 space-y-1.5">
                            {w.sizes!.map((s) => {
                              const line = lineOf(w, s.id);
                              const n = cart.find((i) => i.dishId === line)?.quantity ?? 0;
                              return (
                                <div key={s.id} className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-bold text-ink">
                                    {s.label} <span className="text-primary tabular">{inr(s.price)}</span>
                                  </span>
                                  {n === 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => add(w, s.id)}
                                      className="flex items-center gap-1 rounded-full border border-primary px-2.5 py-1 text-[11px] font-bold text-primary"
                                    >
                                      <Plus className="size-3" /> Add
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1 rounded-full bg-primary px-1 py-0.5 text-white">
                                      <button type="button" onClick={() => setQty(line, -1)} className="flex size-6 items-center justify-center" aria-label="Less">
                                        <Minus className="size-3" />
                                      </button>
                                      <span className="min-w-4 text-center text-[12px] font-bold tabular">{n}</span>
                                      <button type="button" onClick={() => setQty(line, 1)} className="flex size-6 items-center justify-center" aria-label="More">
                                        <Plus className="size-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                      <div className="relative shrink-0">
                        <FoodImg src={w.imageUrl} alt={w.name} className="size-[88px] rounded-[14px] object-cover" />
                        {!sized && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                            {q === 0 ? (
                              <button
                                type="button"
                                onClick={() => add(w)}
                                className="rounded-[10px] border-[1.5px] border-primary bg-surface px-4 py-1.5 text-[11px] font-bold text-primary shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 rounded-[10px] bg-primary px-1 py-1 text-white shadow-md">
                                <button type="button" onClick={() => setQty(lineOf(w), -1)} className="flex size-7 items-center justify-center" aria-label="Less">
                                  <Minus className="size-3.5" />
                                </button>
                                <span className="min-w-5 text-center text-[12px] font-bold tabular">{q}</span>
                                <button type="button" onClick={() => setQty(lineOf(w), 1)} className="flex size-7 items-center justify-center" aria-label="More">
                                  <Plus className="size-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        <ReviewsBlock
          restaurantId={id}
          canned={REVIEWS[id] ?? []}
          live={reviews.filter((rv) => rv.restaurantId === id)}
          user={user}
          stars={revStars}
          text={revText}
          setStars={setRevStars}
          setText={setRevText}
          onSubmit={() => {
            if (!user) {
              nav({ to: "/login" });
              return;
            }
            if (!revText.trim()) return;
            addReview(id, revStars, revText);
            setRevText("");
            setRevStars(5);
          }}
        />
      </div>

      {count > 0 && user && (
        <div className="fixed inset-x-0 bottom-[72px] z-40 px-4 pr-[76px] md:bottom-5 md:pr-[84px]">
          <div className="mx-auto max-w-[920px] overflow-hidden rounded-[22px] bg-surface shadow-lift">
            <button
              type="button"
              onClick={() => setBagOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-bold text-ink">
                <ShoppingBag className="size-4 shrink-0 text-primary" />
                <span className="truncate">
                  {count} item{count === 1 ? "" : "s"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[13px] font-bold tabular">{inr(cartTotal)}</span>
                {bagOpen ? <ChevronDown className="size-4 text-muted" /> : <ChevronUp className="size-4 text-muted" />}
              </span>
            </button>
            {bagOpen && (
              <div className="max-h-44 overflow-y-auto border-t border-line-soft px-4 py-2">
                {mine.map((i) => (
                  <div key={i.dishId} className="flex items-center gap-2 py-1.5">
                    <FoodImg src={i.imageUrl} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
                    <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink">{i.name}</p>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-sage px-1">
                      <button type="button" onClick={() => setQty(i.dishId, -1)} className="flex size-6 items-center justify-center" aria-label="Less">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-4 text-center text-[12px] font-bold tabular">{i.quantity}</span>
                      <button type="button" onClick={() => setQty(i.dishId, 1)} className="flex size-6 items-center justify-center" aria-label="More">
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <span className="w-14 shrink-0 text-right text-[12px] font-bold tabular">{inr(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                useZoomo.getState().setActiveBag(id);
                nav({ to: "/cart" });
              }}
              className="btn-primary m-3 mt-0 w-[calc(100%-1.5rem)] py-3 text-sm"
            >
              View bag · {inr(cartTotal)}
            </button>
          </div>
        </div>
      )}
      <ZoomoChat />
      <MobileDock />
    </div>
  );
}

function ReviewsBlock({
  restaurantId,
  canned,
  live,
  user,
  stars,
  text,
  setStars,
  setText,
  onSubmit,
}: {
  restaurantId: string;
  canned: { name: string; rating: number; text: string }[];
  live: { id: string; name: string; rating: number; text: string }[];
  user: { name: string } | null;
  stars: number;
  text: string;
  setStars: (n: number) => void;
  setText: (t: string) => void;
  onSubmit: () => void;
}) {
  const all = [
    ...live.map((r) => ({ key: r.id, name: r.name, rating: r.rating, text: r.text })),
    ...canned.map((r, i) => ({ key: `${restaurantId}-c${i}`, name: r.name, rating: r.rating, text: r.text })),
  ];
  return (
    <section className="mb-8 rounded-[22px] bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="display text-[20px] text-ink">Reviews</h2>
        <span className="text-[12px] font-bold text-muted">{all.length}</span>
      </div>
      <div className="mb-4 space-y-3">
        {all.slice(0, 6).map((r) => (
          <div key={r.key} className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink">{r.name}</p>
              <span className="flex items-center gap-1 text-[12px] font-bold text-ink">
                <Star className="size-3 fill-primary text-primary" /> {r.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-[12px] leading-5 text-sub">{r.text}</p>
          </div>
        ))}
        {all.length === 0 && <p className="text-sm text-sub">Be the first to review this kitchen.</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <p className="mb-2 text-[12px] font-bold text-ink">{user ? "Your review" : "Sign in to review"}</p>
        <div className="mb-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className="p-0.5"
              aria-label={`${n} stars`}
            >
              <Star className={`size-5 ${n <= stars ? "fill-primary text-primary" : "text-line"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was the bag?"
          rows={2}
          className="mb-2 w-full rounded-xl border-[1.5px] border-line bg-page px-3 py-2 text-sm"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-[12px]">
          Post review
        </button>
      </form>
    </section>
  );
}
