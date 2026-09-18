import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { RestaurantCard } from "@/components/zoomo/restaurant-card";
import { CuisineChips } from "@/components/zoomo/cuisine-chips";
import { CUISINES, DISHES, FILTERS, RESTAURANTS, etaMinOf, matchesCuisine } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";
import { rankKitchens } from "@/lib/taste";

export const Route = createFileRoute("/restaurants")({ component: RestaurantsPage });

function RestaurantsPage() {
  const nav = useNavigate();
  const { location, user, orders, favorites, visits } = useZoomo();
  const [chip, setChip] = useState<(typeof CUISINES)[number]>("All");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<"forYou" | "rating" | "fast" | "cost">("forYou");
  const ranked = useMemo(
    () => rankKitchens(RESTAURANTS, { orders, favorites, vegOnly: Boolean(user?.vegOnly), visits }),
    [orders, favorites, user?.vegOnly, visits],
  );
  const meta = useMemo(() => new Map(ranked.map((row) => [row.restaurant.id, row])), [ranked]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const vegOnly = Boolean(user?.vegOnly) || filters.includes("veg");
    let list = ranked.map((row) => row.restaurant).filter((r) => {
      if (!matchesCuisine(r, chip)) return false;
      if (vegOnly && !DISHES.some((d) => d.restaurantId === r.id && d.isVegetarian)) return false;
      if (filters.includes("fast") && etaMinOf(r) > 22) return false;
      if (filters.includes("rated") && r.rating < 4.5) return false;
      if (filters.includes("offers") && !r.coupon) return false;
      if (!query) return true;
      return (
        r.name.toLowerCase().includes(query) ||
        r.cuisineType.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    });
    if (sort !== "forYou") {
      list = [...list].sort((a, b) => {
        if (sort === "fast") return etaMinOf(a) - etaMinOf(b);
        if (sort === "cost") return a.costForTwo - b.costForTwo;
        return b.rating - a.rating;
      });
    }
    return list;
  }, [chip, q, user?.vegOnly, filters, sort, ranked]);

  return (
    <AppShell footer>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <BackBar title="All restaurants" to="/" />
        <p className="mb-6 text-sm text-sub">{location ? `Delivering in ${location}` : "Jourian, Jammu & Kashmir"}</p>
        <div className="relative mb-5">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search restaurants or cuisines"
            className="field h-12 rounded-[14px] bg-surface pl-[46px]"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mb-4">
          <CuisineChips value={chip} onChange={setChip} />
        </div>
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const on = filters.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilters((s) => (on ? s.filter((x) => x !== f.id) : [...s, f.id]))}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${on ? "bg-primary text-white" : "bg-sage text-primary"}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-medium text-muted tabular">{filtered.length} available</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-bold"
          >
            <option value="forYou">For you</option>
            <option value="rating">Top rated</option>
            <option value="fast">Fastest</option>
            <option value="cost">Cost for two</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard
              key={r.id}
              r={r}
              onOpen={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
            />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
