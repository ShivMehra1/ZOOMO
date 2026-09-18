import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPinned, ShieldCheck, UtensilsCrossed, Zap } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { EmptyState } from "@/components/zoomo/modals";
import { RestaurantCard } from "@/components/zoomo/restaurant-card";
import { ActiveOrderBanner } from "@/components/zoomo/tracker";
import { OffersSection } from "@/components/zoomo/offers";
import { DishCard } from "@/components/zoomo/dish-card";
import { FoodImg } from "@/components/zoomo/food-img";
import { HomeHero } from "@/components/zoomo/hero";

import { FoodRow } from "@/components/zoomo/food-row";
import { UsualsRow } from "@/components/zoomo/usuals";
import { ZoneMap } from "@/components/zoomo/zone-map";
import {
  CATEGORIES,
  DISHES,
  IMG,
  RESTAURANTS,
  TOWN,
  WHY,
  inr,
  liveStatus,
  dishesMatchingCraving,
  matchesCuisine,
  popularDishes,
  restaurantById,
  type Dish,
} from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";
import { dishesForYou, rankKitchens } from "@/lib/taste";

export const Route = createFileRoute("/")({ component: Home });

const WHY_ICONS = [Zap, MapPinned, ShieldCheck];

function Home() {
  const nav = useNavigate();
  const { user, orders, setLocation, cart, favorites, visits } = useZoomo();
  const [chip, setChip] = useState<(typeof CATEGORIES)[number]["id"] | "All">("All");
  const [craveRest, setCraveRest] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeOrder = orders.find((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });

  const taste = useMemo(
    () => ({ orders, favorites, vegOnly: Boolean(user?.vegOnly), visits }),
    [orders, favorites, user?.vegOnly, visits],
  );
  const ranked = useMemo(() => rankKitchens(RESTAURANTS, taste), [taste]);
  const kitchens = useMemo(() => {
    return ranked.filter((row) => {
      const r = row.restaurant;
      if (chip !== "All" && !matchesCuisine(r, chip)) return false;
      if (taste.vegOnly && !DISHES.some((d) => d.restaurantId === r.id && d.isVegetarian)) return false;
      return true;
    });
  }, [ranked, chip, taste.vegOnly]);
  const forYou = useMemo(() => dishesForYou(taste), [taste]);
  const cravingDishes = useMemo(() => dishesMatchingCraving(chip), [chip]);
  const cravingByRestaurant = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const d of cravingDishes) {
      const list = map.get(d.restaurantId) || [];
      list.push(d);
      map.set(d.restaurantId, list);
    }
    return [...map.entries()].map(([id, dishes]) => ({
      restaurant: restaurantById(id),
      dishes,
    })).filter((x) => x.restaurant);
  }, [cravingDishes]);
  const shownDishes = useMemo(() => {
    if (craveRest) return cravingDishes.filter((d) => d.restaurantId === craveRest);
    return cravingDishes;
  }, [cravingDishes, craveRest]);
  const preview = shownDishes.slice(0, 6);
  const dishList = viewMore || craveRest ? shownDishes : preview;

  const saved = useMemo(
    () => RESTAURANTS.filter((r) => favorites.includes(r.id)),
    [favorites],
  );

  const popular = popularDishes();

  useEffect(() => {
    const jump = () => {
      if (window.location.hash === "#offers") {
        document.getElementById("offers")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const t = setTimeout(jump, 80);
    window.addEventListener("hashchange", jump);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", jump);
    };
  }, []);

  return (
    <AppShell footer>
      <div className="landing-wash">
      <HomeHero onSearch={() => nav({ to: "/search" })} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-4 px-5">
        {activeOrder && (
          <ActiveOrderBanner
            order={activeOrder}
            onOpen={() => nav({ to: "/orders/$id", params: { id: activeOrder.id } })}
          />
        )}
      </div>

      <main className="mx-auto max-w-6xl px-5 pt-8 pb-16">
        <FoodRow
          chip={chip}
          onChip={(id) => {
            setChip((c) => (c === id ? "All" : (id as typeof c)));
            setCraveRest(null);
            setViewMore(false);
            gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <div ref={gridRef} className="mb-4">
          {chip !== "All" && craveRest ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCraveRest(null);
                  setViewMore(false);
                }}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface"
                aria-label="Back to all restaurants"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <p className="kicker mb-0.5">{chip}</p>
                <h2 className="display truncate text-[20px] text-ink">{restaurantById(craveRest)?.name}</h2>
              </div>
            </div>
          ) : (
            <div>
              <p className="kicker mb-1">{chip === "All" ? "Open now" : chip}</p>
              <h2 className="display text-[22px] text-ink">
                {chip === "All"
                  ? user
                    ? "Picked for you"
                    : `${kitchens.length} restaurants nearby`
                  : `${chip} in Jourian`}
              </h2>
            </div>
          )}
        </div>

        {chip !== "All" ? (
          cravingDishes.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="size-7" />}
              title={`No ${chip.toLowerCase()} on the menus`}
              sub="Try another craving"
              cta="Show all"
              onCta={() => setChip("All")}
            />
          ) : (
            <div className="mb-12">
              <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setCraveRest(null);
                    setViewMore(false);
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold ${
                    !craveRest ? "bg-primary text-white" : "bg-surface text-ink shadow-card"
                  }`}
                >
                  All
                </button>
                {cravingByRestaurant.map(({ restaurant, dishes }) => (
                  <button
                    key={restaurant!.id}
                    type="button"
                    onClick={() => {
                      setCraveRest(restaurant!.id);
                      setViewMore(true);
                    }}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold ${
                      craveRest === restaurant!.id ? "bg-primary text-white" : "bg-surface text-ink shadow-card"
                    }`}
                  >
                    {restaurant!.name}
                    <span className={`ml-1.5 text-[11px] ${craveRest === restaurant!.id ? "text-white/70" : "text-muted"}`}>
                      {dishes.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {dishList.map((d) => (
                  <DishCard
                    key={d.id}
                    dish={d}
                    hideRestaurant={Boolean(craveRest)}
                    onOpen={() => nav({ to: "/restaurant/$id", params: { id: d.restaurantId } })}
                    onNeedLogin={() => nav({ to: "/login" })}
                  />
                ))}
              </div>
              {!viewMore && !craveRest && shownDishes.length > 6 && (
                <button
                  type="button"
                  onClick={() => setViewMore(true)}
                  className="mt-5 h-12 w-full rounded-2xl border border-line bg-surface text-sm font-bold text-ink"
                >
                  View more {chip.toLowerCase()}
                </button>
              )}
            </div>
          )
        ) : kitchens.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="size-7" />}
            title="No restaurants yet"
            sub="Menus load from the live Zoomo backend"
            cta="Reset"
            onCta={() => setChip("All")}
          />
        ) : (
          <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {kitchens.map((row) => (
              <RestaurantCard
                key={row.restaurant.id}
                r={row.restaurant}
                onOpen={() => nav({ to: "/restaurant/$id", params: { id: row.restaurant.id } })}
              />
            ))}
          </div>
        )}

        <UsualsRow />

        {user && forYou.length > 0 && (
          <DishRail title="Because you order this" kicker="For you" dishes={forYou} />
        )}


        {saved.length > 0 && (
          <div className="mb-12">
            <p className="kicker mb-1">Yours</p>
            <h2 className="display mb-4 text-[22px] text-ink">Saved restaurants</h2>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {saved.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
                  className="w-[220px] shrink-0 overflow-hidden rounded-[22px] bg-surface text-left shadow-card"
                >
                  <FoodImg src={r.imageUrl} alt={r.name} className="h-28 w-full object-cover" />
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{r.cuisineType} · {r.eta}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {popular.length > 0 && (
          <>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="kicker mb-1">Tonight’s usuals</p>
                <h2 className="display text-[22px] text-ink">Popular in {TOWN}</h2>
              </div>
            </div>
            <div className="no-scrollbar mb-12 flex gap-4 overflow-x-auto pb-2">
              {popular.map((d) => {
                const r = restaurantById(d.restaurantId);
                return (
                  <button
                    key={d.id}
                    onClick={() => nav({ to: "/restaurant/$id", params: { id: d.restaurantId } })}
                    className="w-[220px] shrink-0 overflow-hidden rounded-[22px] bg-surface text-left shadow-card"
                  >
                    <FoodImg src={d.imageUrl} alt={d.name} className="h-32 w-full object-cover" />
                    <div className="p-3">
                      <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {r?.name} · {r?.area}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-primary tabular">{inr(d.price)}</span>
                        <span className="text-muted">{d.isVegetarian ? "Veg" : "Non-veg"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mb-12">
          <OffersSection />
        </div>

        <div className="mt-14">
          <ZoneMap onPick={setLocation} />
        </div>

        <div className="mt-16 grid grid-cols-1 overflow-hidden rounded-[28px] bg-primary md:grid-cols-2">
          <div className="px-7 py-10 text-white">
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-white/50 uppercase">Live tracking</p>
            <h2 className="display mb-3 text-[28px]">Watch it leave the bazaar.</h2>
            <p className="mb-6 max-w-sm text-sm leading-6 text-white/65">
              Restaurant, rider, your street in {TOWN}. Short town. Short wait.
            </p>
            <button
              onClick={() => nav({ to: user ? "/orders" : "/login" })}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary"
            >
              Track an order
            </button>
          </div>
          <div className="relative min-h-[220px]">
            <img src={IMG.trackPanel} alt="" className="absolute inset-0 size-full object-cover opacity-55" />
          </div>
        </div>

        <div className="mt-16 border-t border-line-soft pt-14">
          <div className="mb-10 max-w-lg">
            <p className="kicker mb-3">How Zoomo works here</p>
            <h2 className="display text-[clamp(1.6rem,3vw,2.1rem)] text-ink">Three taps. Then your gate.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {WHY.map((b, i) => {
              const Icon = WHY_ICONS[i] ?? Zap;
              return (
                <div key={b.title} className="rounded-[24px] bg-surface p-6 shadow-card">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-sage text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.14em] text-muted tabular">0{i + 1}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold tracking-tight text-ink">{b.title}</h3>
                  <p className="text-sm leading-6 text-sub">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => nav({ to: "/cart" })}
          className="btn-primary fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 shadow-lift md:bottom-5"
        >
          <span className="text-sm font-bold">
            View bag · {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
          <span className="text-sm font-bold tabular">
            {inr(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
          </span>
        </button>
      )}
      </div>
    </AppShell>
  );
}

function DishRail({ title, kicker, dishes }: { title: string; kicker: string; dishes: Dish[] }) {
  const nav = useNavigate();
  const { addToCart, user } = useZoomo();
  return (
    <div className="mb-12">
      <p className="kicker mb-1">{kicker}</p>
      <h2 className="display mb-4 text-[22px] text-ink">{title}</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {dishes.map((d) => {
          const r = restaurantById(d.restaurantId);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                if (!user) {
                  nav({ to: "/login" });
                  return;
                }
                addToCart(d, d.sizes?.[0]?.id);
                nav({ to: "/restaurant/$id", params: { id: d.restaurantId } });
              }}
              className="w-[200px] shrink-0 overflow-hidden rounded-[22px] bg-surface text-left shadow-card"
            >
              <FoodImg src={d.imageUrl} alt={d.name} className="h-28 w-full object-cover" />
              <div className="p-3">
                <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                <p className="truncate text-[11px] text-muted">{r?.name}</p>
                <p className="mt-2 text-xs font-bold text-primary tabular">{inr(d.price)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
