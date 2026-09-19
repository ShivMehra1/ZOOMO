import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Heart, MapPin, Minus, Phone, Plus, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";
import { FoodImg } from "@/components/zoomo/food-img";
import { MobileDock } from "@/components/zoomo/dock";
import { dishesFor, IMG, inr, LIVE_REVIEWS, restaurantById, type Dish } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/restaurant/$id")({ component: RestaurantPage });

function RestaurantPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const goHome = () => nav({ to: "/" });
  const r = restaurantById(id);

  const { cart, addToCart, setQty, user, favorites, toggleFavorite, dishOff = [], reviews } = useZoomo();
  const dishes = dishesFor(id).filter((d) => !user?.vegOnly || d.isVegetarian);
  const loved = favorites.includes(id);
  const mine = cart.filter((i) => i.restaurantId === id);
  const count = mine.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = mine.reduce((s, i) => s + i.price * i.quantity, 0);
  const [cat, setCat] = useState("All");
  const [bagOpen, setBagOpen] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function pickCat(c: string) {
    setCat(c);
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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
    const priceOf = (d: Dish) =>
      d.sizes?.length ? Math.min(...d.sizes.map((s) => s.price)) : d.price;
    return order.map((key) => ({
      cat: key,
      items: [...map.get(key)!].sort((a, b) => priceOf(a) - priceOf(b)),
    }));
  }, [dishes]);

  const shown = cat === "All" ? groups : groups.filter((g) => g.cat === cat);

  if (!r) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="text-center">
          <p className="mb-3 text-lg font-bold text-ink">Restaurant not found</p>
          <button type="button" onClick={goHome} className="text-sm font-semibold text-primary">
            Go back
          </button>
        </div>
      </div>
    );
  }

  function add(d: Dish, size?: string) {
    if (dishOff.includes(d.id)) return;
    const res = addToCart(d, size);
    if (res === "login") nav({ to: "/login" });
    else setBagOpen(true);
  }

  function lineOf(d: Dish, size?: string) {
    return `${d.id}${size ? `__${size}` : ""}`;
  }

  return (
    <div className={`min-h-screen bg-page md:pb-28 ${count > 0 ? "pb-52" : "pb-36"}`}>
      <div className="sticky top-0 z-40 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 sm:px-5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goHome();
            }}
            className="relative z-50 flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          {scrolled && (
            <FoodImg
              src={r.imageUrl || IMG.restaurantFallback}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover"
            />
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{r.name}</p>
          <button
            type="button"
            onClick={() => (user ? toggleFavorite(id) : nav({ to: "/login" }))}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink"
            aria-label="Add to favourites"
          >
            <Heart className={`size-4 ${loved ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-5 sm:pt-6">
        <div className="overflow-hidden rounded-[22px] bg-surface shadow-card md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="relative aspect-[16/10] bg-sage md:aspect-auto md:min-h-[320px] lg:min-h-[400px]">
            <FoodImg
              src={r.imageUrl || IMG.restaurantFallback}
              alt={r.name}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 md:px-7">
            {r.cuisineType && <p className="kicker">{r.cuisineType}</p>}
            <h1 className="display text-[clamp(1.7rem,3vw,2.35rem)] text-ink">{r.name}</h1>
            <p className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
              <Star className="size-4 fill-primary text-primary" /> {Number(r.rating || 0).toFixed(1)}
              {r.coupon ? <span className="ml-2 rounded-full bg-sage px-2 py-0.5 text-[11px] font-bold text-primary">{r.coupon}</span> : null}
            </p>
            <div className="space-y-3">
              {(r.address || r.area) && (
                <p className="flex items-start gap-3 text-[14px] leading-6 text-sub">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-ink">{r.address || r.area}</span>
                </p>
              )}
              <a
                href={r.phone ? `tel:${r.phone}` : undefined}
                className={`flex items-center gap-3 text-[14px] font-semibold ${r.phone ? "text-primary" : "pointer-events-none text-muted"}`}
              >
                <Phone className="size-4 shrink-0" />
                {r.phone || "Phone not listed yet"}
              </a>
              {r.openingHours ? (
                <p className="flex items-start gap-3 text-[14px] leading-6 text-sub">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{r.openingHours}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {groups.length > 1 && (
        <div className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-20 mt-5 border-y border-line bg-surface/95 backdrop-blur-md">
          <div className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-5">
            {["All", ...groups.map((g) => g.cat)].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCat(c)}
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

      <div ref={menuRef} className="mx-auto max-w-6xl scroll-mt-[7.5rem] px-4 py-7 sm:px-5">
        {dishes.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-sage text-primary">
              <UtensilsCrossed className="size-6" />
            </div>
            <p className="text-sub">No dishes available right now</p>
          </div>
        ) : (
          shown.map((g) => (
            <section key={g.cat} className="mb-10">
              <h2 className="display mb-4 text-[20px] text-ink">{g.cat}</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {g.items.map((w) => {
                  const q = cart.find((i) => i.dishId === lineOf(w))?.quantity ?? 0;
                  const sized = Boolean(w.sizes?.length);
                  const off = dishOff.includes(w.id);
                  const sizes = sized ? [...w.sizes!].sort((a, b) => a.price - b.price) : [];
                  return (
                    <div key={w.id} className={`flex gap-3 rounded-[18px] bg-surface p-3 shadow-card sm:gap-3.5 sm:rounded-[22px] sm:p-3.5 ${off ? "opacity-55" : ""}`}>
                      <FoodImg src={w.imageUrl} alt={w.name} className="size-20 shrink-0 rounded-[14px] object-cover sm:size-[108px]" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-bold tracking-[-0.02em] text-ink">{w.name}</h3>
                            {off && <p className="text-[11px] font-bold text-danger">Sold out</p>}
                            {w.description && (
                              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted">{w.description}</p>
                            )}
                          </div>
                        </div>
                        {sized ? (
                          <div className="mt-auto space-y-1.5 pt-2">
                            {sizes.map((s) => {
                              const line = lineOf(w, s.id);
                              const n = cart.find((i) => i.dishId === line)?.quantity ?? 0;
                              return (
                                <div key={s.id} className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-semibold text-ink">
                                    {s.label} <span className="font-bold text-primary tabular">{inr(s.price)}</span>
                                  </span>
                                  <QtyCtrl n={n} onAdd={() => add(w, s.id)} onLess={() => setQty(line, -1)} onMore={() => setQty(line, 1)} />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                            <p className="text-[15px] font-bold text-primary tabular">{inr(w.price)}</p>
                            <QtyCtrl n={q} onAdd={() => add(w)} onLess={() => setQty(lineOf(w), -1)} onMore={() => setQty(lineOf(w), 1)} />
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
          live={[
            ...reviews.filter((rv) => rv.restaurantId === id),
            ...LIVE_REVIEWS.filter((rv) => rv.restaurantId === id),
          ]}
        />
      </div>

      {count > 0 && user && (
        <div className="fixed inset-x-0 bottom-[72px] z-40 px-4 md:bottom-5">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[22px] bg-surface shadow-lift">
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
      <MobileDock />
    </div>
  );
}

function QtyCtrl({
  n,
  onAdd,
  onLess,
  onMore,
}: {
  n: number;
  onAdd: () => void;
  onLess: () => void;
  onMore: () => void;
}) {
  if (n === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="h-9 shrink-0 rounded-full border-[1.5px] border-primary bg-surface px-4 text-[12px] font-bold text-primary"
      >
        Add
      </button>
    );
  }
  return (
    <div className="flex h-9 shrink-0 items-center rounded-full bg-primary px-1 text-white">
      <button type="button" onClick={onLess} className="flex size-8 items-center justify-center" aria-label="Less">
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-4 text-center text-[12px] font-bold tabular">{n}</span>
      <button type="button" onClick={onMore} className="flex size-8 items-center justify-center" aria-label="More">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function ReviewsBlock({
  live,
}: {
  live: { id: string; name: string; rating: number; text: string }[];
}) {
  const rows = live.filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);
  return (
    <section className="mb-8 rounded-[22px] bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="display text-[20px] text-ink">Reviews</h2>
        <span className="text-[12px] font-bold text-muted">{rows.length}</span>
      </div>
      <div className="space-y-3">
        {rows.slice(0, 8).map((r) => (
          <div key={r.id} className="border-b border-line-soft pb-3 last:border-0 last:pb-0">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink">{r.name}</p>
              <span className="flex items-center gap-1 text-[12px] font-bold text-ink">
                <Star className="size-3 fill-primary text-primary" /> {r.rating.toFixed(1)}
              </span>
            </div>
            {r.text ? <p className="text-[12px] leading-5 text-sub">{r.text}</p> : null}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-sub">No reviews yet</p>}
      </div>
    </section>
  );
}
