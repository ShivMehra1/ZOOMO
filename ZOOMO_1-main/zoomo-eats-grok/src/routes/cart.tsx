import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { QtyStepper } from "@/components/zoomo/qty";
import { IMG, inr, restaurantById } from "@/lib/zoomo-data";
import { cartTotals, useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const nav = useNavigate();
  const { cart, setQty, removeItem, user, clearBag, setActiveBag } = useZoomo();

  const groups = [...new Set(cart.map((i) => i.restaurantId))].map((rid) => {
    const items = cart.filter((i) => i.restaurantId === rid);
    const r = restaurantById(rid);
    return { rid, r, items, totals: cartTotals(items, null, 0, "DELIVERY", false) };
  });
  const allTotal = groups.reduce((s, g) => s + g.totals.total, 0);
  const allCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <AppShell>
      <div className={`mx-auto max-w-[640px] px-5 py-6 ${cart.length ? "pb-28" : ""}`}>
        <BackBar title={groups.length > 1 ? "Your bags" : "Your bag"} to="/" />

        {cart.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-20 items-center justify-center rounded-[24px] bg-sage text-primary">
              <ShoppingBag className="size-8" />
            </div>
            <h2 className="display mb-1.5 text-[22px] text-ink">Bag is empty</h2>
            <p className="mb-6 text-sm text-sub">Add food, then plus and minus here.</p>
            <button type="button" onClick={() => nav({ to: "/restaurants" })} className="btn-primary px-6 py-3 text-sm">
              Browse restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.rid} className="overflow-hidden rounded-[24px] bg-surface shadow-card">
                <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                  <button
                    type="button"
                    onClick={() => nav({ to: "/restaurant/$id", params: { id: g.rid } })}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate text-sm font-bold text-ink">{g.r?.name ?? "Restaurant"}</p>
                    <p className="text-xs text-muted">
                      {g.r?.area} · {g.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </button>
                  <button type="button" onClick={() => clearBag(g.rid)} className="text-xs font-bold text-danger">
                    Clear
                  </button>
                </div>
                <div className="divide-y divide-line-soft">
                  {g.items.map((j) => (
                    <div key={j.dishId} className="flex items-center gap-3 px-3 py-3">
                      <FoodImg src={j.imageUrl || IMG.dishFallback} alt="" className="size-[72px] rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{j.name}</p>
                        {j.forPerson && <p className="text-[11px] text-primary">For {j.forPerson}</p>}
                        <p className="text-xs text-muted tabular">{inr(j.price)} each</p>
                        <p className="mt-1 text-sm font-bold text-primary tabular">{inr(j.price * j.quantity)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <QtyStepper
                          value={j.quantity}
                          onLess={() => setQty(j.dishId, -1)}
                          onMore={() => setQty(j.dishId, 1)}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(j.dishId)}
                          className="text-muted hover:text-danger"
                          aria-label="Remove"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line-soft px-4 py-3">
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="text-sub">Restaurant total</span>
                    <span className="font-bold text-ink tabular">{inr(g.totals.total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return nav({ to: "/login" });
                      setActiveBag(g.rid);
                      nav({ to: "/checkout" });
                    }}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    Checkout {g.r?.name} · {inr(g.totals.total)}
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 px-4 pr-[76px] md:bottom-4 md:pr-[84px]">
          <div className="mx-auto flex max-w-[640px] items-center justify-between rounded-full bg-primary px-5 py-3 text-white shadow-lift">
            <span className="text-sm font-bold tabular">
              {allCount} item{allCount === 1 ? "" : "s"} · {inr(allTotal)}
            </span>
            <span className="text-[12px] text-white/70">Total</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}
