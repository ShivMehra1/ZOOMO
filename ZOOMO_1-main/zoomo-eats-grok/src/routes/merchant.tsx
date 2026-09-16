import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { FoodImg } from "@/components/zoomo/food-img";
import { DISHES, inr, liveStatus, restaurantById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/merchant")({ component: MerchantPage });

const FLOW: Record<string, { next: string; label: string } | null> = {
  PENDING: { next: "PREPARING", label: "Accept" },
  CONFIRMED: { next: "PREPARING", label: "Start cooking" },
  PREPARING: { next: "READYFORPICKUP", label: "Bag ready" },
  READYFORPICKUP: null,
  OUTFORDELIVERY: null,
  DELIVERED: null,
  CANCELLED: null,
};

function MerchantPage() {
  return (
    <StaffShell role="MERCHANT" title="Kitchen">
      <Kitchen />
    </StaffShell>
  );
}

function Kitchen() {
  const { staff, orders, setOrderLiveStatus, dishOff = [], toggleDishOff } = useZoomo();
  const [tab, setTab] = useState<"tickets" | "menu">("tickets");
  const mine = orders.filter((o) => !staff?.restaurantId || o.restaurantId === staff.restaurantId);

  return (
    <>
      <div className="mb-6 flex gap-2">
        {(["tickets", "menu"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${tab === t ? "bg-primary text-white" : "bg-surface text-sub"}`}
          >
            {t === "tickets" ? "Tickets" : "Menu"}
          </button>
        ))}
      </div>

      {tab === "menu" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {DISHES.filter((d) => !staff?.restaurantId || d.restaurantId === staff.restaurantId)
            .slice(0, 40)
            .map((d) => {
              const off = dishOff.includes(d.id);
              return (
                <div key={d.id} className="flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-card">
                  <FoodImg src={d.imageUrl} alt="" className="size-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                    <p className="text-xs text-muted">{inr(d.price)}</p>
                  </div>
                  <button
                    onClick={() => toggleDishOff(d.id)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${off ? "bg-danger/10 text-danger" : "bg-sage text-primary"}`}
                  >
                    {off ? "Sold out" : "Live"}
                  </button>
                </div>
              );
            })}
        </div>
      ) : mine.length === 0 ? (
        <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No tickets yet. Place a customer order and it lands here.</p>
      ) : (
        <div className="space-y-3">
          {mine.map((o) => {
            const st = liveStatus(o);
            const flow = FLOW[st];
            const r = restaurantById(o.restaurantId);
            return (
              <div key={o.id} className="rounded-[24px] bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{r?.name} · #{o.id}</p>
                    <p className="mt-1 text-lg font-bold text-ink">{o.customerName || "Guest"}</p>
                    <p className="text-xs text-sub">{o.customerPhone || o.address?.street || "Jourian"}</p>
                  </div>
                  <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-bold text-primary">{st}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-sub">
                  {o.items.map((i) => (
                    <li key={i.dishId} className="flex justify-between">
                      <span>
                        {i.name} × {i.quantity}
                      </span>
                      <span className="tabular">{inr(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {o.orderType === "DELIVERY" && st !== "CANCELLED" && st !== "DELIVERED" && (
                  <div className="mt-4 flex gap-2">
                    {flow && (
                      <button
                        onClick={() => setOrderLiveStatus(o.id, flow.next)}
                        className="btn-primary h-11 flex-1 text-sm"
                      >
                        {flow.label}
                      </button>
                    )}
                    {st === "PENDING" || st === "CONFIRMED" || st === "PREPARING" ? (
                      <button
                        onClick={() => setOrderLiveStatus(o.id, "CANCELLED")}
                        className="btn-ghost h-11 px-4 text-sm text-danger"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
