import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { RestaurantCard } from "@/components/zoomo/restaurant-card";
import { DISHES, RESTAURANTS, inr, restaurantById } from "@/lib/zoomo-data";

export const Route = createFileRoute("/search")({ component: SearchPage });

function SearchPage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const kitchens = useMemo(() => {
    if (!query) return RESTAURANTS;
    return RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.cuisineType.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query),
    );
  }, [query]);

  const dishes = useMemo(() => {
    if (!query) return DISHES.slice(0, 8);
    return DISHES.filter((d) => d.name.toLowerCase().includes(query) || d.description.toLowerCase().includes(query));
  }, [query]);

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-5 py-6">
        <BackBar title="Search" to="/" />
        <div className="relative mb-8">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Restaurants, dishes, cuisines"
            className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-sm outline-none focus:border-primary"
          />
        </div>

        <h2 className="mb-3 text-sm font-bold text-ink">Dishes</h2>
        <div className="mb-8 space-y-2">
          {dishes.map((d) => {
            const r = restaurantById(d.restaurantId);
            return (
              <button
                key={d.id}
                onClick={() => nav({ to: "/restaurant/$id", params: { id: d.restaurantId } })}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-2.5 text-left shadow-card"
              >
                <img src={d.imageUrl} alt="" className="size-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                  <p className="truncate text-xs text-muted">{r?.name}</p>
                </div>
                <span className="text-sm font-bold text-primary tabular">{inr(d.price)}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 text-sm font-bold text-ink">Restaurants</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kitchens.map((r) => (
            <RestaurantCard key={r.id} r={r} onOpen={() => nav({ to: "/restaurant/$id", params: { id: r.id } })} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
