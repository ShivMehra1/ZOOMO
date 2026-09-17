import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapPinned, ShieldCheck, UtensilsCrossed, Zap } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { EmptyState } from "@/components/zoomo/modals";
import { RestaurantCard } from "@/components/zoomo/restaurant-card";
import { ActiveOrderBanner } from "@/components/zoomo/tracker";
import { OffersSection } from "@/components/zoomo/offers";
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
  matchesCuisine,
  popularDishes,
  restaurantById,
} from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/")({ component: Home });

const WHY_ICONS = [Zap, MapPinned, ShieldCheck];

function Home() {
  const nav = useNavigate();
  const { user, orders, setLocation, cart, favorites } = useZoomo();
  const [chip, setChip] = useState<(typeof CATEGORIES)[number]["id"] | "All">("All");
  const gridRef = useRef<HTMLDivElement>(null);
  const activeOrder = orders.find((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });

  const kitchens = useMemo(() => {
    const vegOnly = Boolean(user?.vegOnly);
    return RESTAURANTS.filter((r) => {
      if (chip !== "All" && !matchesCuisine(r, chip)) return false;
      if (vegOnly && !DISHES.some((d) => d.restaurantId === r.id && d.isVegetarian)) return false;
      return true;
    });
  }, [chip, user?.vegOnly]);

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
            gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <div ref={gridRef} className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="kicker mb-1">{chip === "All" ? "Open now" : chip}</p>
            <h2 className="display text-[22px] text-ink">{kitchens.length} restaurants nearby</h2>
          </div>
        </div>

        {kitchens.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="size-7" />}
            title="No kitchens yet"
            sub="Menus load from the live Zoomo backend"
            cta="Reset"
            onCta={() => setChip("All")}
          />
        ) : (
          <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {kitchens.map((r) => (
              <RestaurantCard
                key={r.id}
                r={r}
                onOpen={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
              />
            ))}
          </div>
        )}

        <UsualsRow />

        {saved.length > 0 && (
          <div className="mb-12">
            <p className="kicker mb-1">Yours</p>
            <h2 className="display mb-4 text-[22px] text-ink">Saved kitchens</h2>
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
            <img src={IMG.biryani} alt="" className="absolute inset-0 size-full object-cover opacity-55" />
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
