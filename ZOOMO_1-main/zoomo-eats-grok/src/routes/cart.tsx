import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, NotebookPen, ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { QtyStepper } from "@/components/zoomo/qty";
import { IMG, inr, restaurantById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const nav = useNavigate();
  const { cart, setQty, removeItem, user, clearBag, setActiveBag, setItemNote } = useZoomo();
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const groups = [...new Set(cart.map((i) => i.restaurantId))].map((rid) => {
    const items = cart.filter((i) => i.restaurantId === rid);
    const r = restaurantById(rid);
    const itemTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { rid, r, items, itemTotal, count };
  });

  function checkout(rid: string) {
    if (!user) return nav({ to: "/login" });
    setActiveBag(rid);
    nav({ to: "/checkout" });
  }

  return (
    <AppShell chat={false}>
      <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-5">
        <BackBar title={groups.length > 1 ? "Your bags" : "Your bag"} to="/" />

        {cart.length === 0 ? (
          <div className="flex flex-col items-center rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-sage text-primary">
              <ShoppingBag className="size-7" />
            </div>
            <h2 className="display mb-1.5 text-[22px] text-ink">Nothing in the bag</h2>
            <p className="mb-6 max-w-xs text-sm text-sub">Item prices only live here. Delivery and tax show up at checkout.</p>
            <button type="button" onClick={() => nav({ to: "/restaurants" })} className="btn-primary px-6 py-3 text-sm">
              Browse restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.length > 1 && (
              <p className="text-sm text-sub">
                {groups.length} restaurants · checkout each bag on its own.
              </p>
            )}
            {groups.map((g) => (
              <section key={g.rid} className="overflow-hidden rounded-[28px] bg-surface shadow-card">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <FoodImg src={g.r?.imageUrl || IMG.restaurantFallback} alt="" className="size-12 rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={() => nav({ to: "/restaurant/$id", params: { id: g.rid } })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[15px] font-bold text-ink">{g.r?.name ?? "Restaurant"}</p>
                    <p className="text-[12px] text-muted">{g.count} item{g.count === 1 ? "" : "s"} · item total {inr(g.itemTotal)}</p>
                  </button>
                  <ChevronRight className="size-4 text-muted" />
                </div>
                <div className="divide-y divide-line-soft border-t border-line-soft">
                  {g.items.map((j) => (
                    <div key={j.dishId} className="flex items-center gap-3 px-4 py-3">
                      <FoodImg src={j.imageUrl || IMG.dishFallback} alt="" className="size-16 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{j.name}</p>
                        <p className="text-[12px] text-muted tabular">{inr(j.price)} × {j.quantity}</p>
                        <p className="mt-0.5 text-sm font-bold text-ink tabular">{inr(j.price * j.quantity)}</p>
                        {editingNote === j.dishId ? (
                          <input
                            autoFocus
                            defaultValue={j.note ?? ""}
                            placeholder="e.g. no onions"
                            onBlur={(e) => {
                              setItemNote(j.dishId, e.target.value);
                              setEditingNote(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditingNote(null);
                            }}
                            className="mt-1.5 w-full rounded-lg bg-page px-2 py-1 text-xs text-ink outline-none"
                          />
                        ) : (
                          <button type="button" onClick={() => setEditingNote(j.dishId)} className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                            <NotebookPen className="size-3" /> {j.note || "Add a note"}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <QtyStepper value={j.quantity} onLess={() => setQty(j.dishId, -1)} onMore={() => setQty(j.dishId, 1)} />
                        <button type="button" onClick={() => removeItem(j.dishId)} className="text-muted hover:text-danger" aria-label="Remove">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line-soft px-4 py-3">
                  <button type="button" onClick={() => clearBag(g.rid)} className="text-xs font-bold text-danger">
                    Clear bag
                  </button>
                  <button type="button" onClick={() => checkout(g.rid)} className="btn-primary px-5 py-2.5 text-sm">
                    Checkout · {inr(g.itemTotal)}
                  </button>
                </div>
              </section>
            ))}
            <p className="px-1 text-center text-[12px] text-muted">Delivery fee and GST are added on the next screen.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
