import { useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { DISHES, inr } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";
import { FoodImg } from "./food-img";

export function UsualsRow() {
  const nav = useNavigate();
  const { orders, addToCart, user } = useZoomo();
  if (!user || orders.length === 0) return null;

  const seen = new Set<string>();
  const usuals: { dishId: string; name: string; imageUrl: string; price: number; restaurantId: string; restaurantName: string }[] = [];
  for (const o of orders) {
    for (const i of o.items) {
      const key = i.dishId.split("__")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      usuals.push({
        dishId: key,
        name: i.name.replace(/ \((S|M|L)\)$/, ""),
        imageUrl: i.imageUrl,
        price: i.price,
        restaurantId: i.restaurantId,
        restaurantName: o.restaurantName,
      });
      if (usuals.length >= 6) break;
    }
    if (usuals.length >= 6) break;
  }
  if (usuals.length === 0) return null;

  return (
    <section className="mb-12">
      <p className="kicker mb-1">For you</p>
      <h2 className="display mb-5 text-[22px] text-ink">Order again</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {usuals.map((u) => (
          <div key={u.dishId} className="w-[200px] shrink-0 overflow-hidden rounded-[22px] bg-surface shadow-card">
            <FoodImg src={u.imageUrl} alt={u.name} className="h-28 w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-sm font-bold text-ink">{u.name}</p>
              <p className="truncate text-[11px] text-muted">{u.restaurantName}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-primary tabular">{inr(u.price)}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      nav({ to: "/login" });
                      return;
                    }
                    const d = DISHES.find((x) => x.id === u.dishId);
                    if (d) addToCart(d, d.sizes?.[0]?.id);
                    nav({ to: "/restaurant/$id", params: { id: u.restaurantId } });
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  <RotateCcw className="size-3" /> Again
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
