import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { FoodImg } from "@/components/zoomo/food-img";
import { inr } from "@/lib/zoomo-data";
import { STAFF_ACCOUNTS, useZoomo } from "@/lib/zoomo-store";
import {
  merchantHasRealSession,
  merchantRealCancelOrder,
  merchantRealGetDishes,
  merchantRealGetMyRestaurant,
  merchantRealGetOrders,
  merchantRealLogin,
  merchantRealToggleDish,
  merchantRealUpdateOrderStatus,
} from "@/lib/real-api";

export const Route = createFileRoute("/merchant")({ component: MerchantPage });

const FLOW: Record<string, { next: string; label: string } | null> = {
  SCHEDULED: { next: "PENDING", label: "Confirm order" },
  PENDING: { next: "PREPARING", label: "Accept" },
  PREPARING: { next: "READY_FOR_PICKUP", label: "Bag ready" },
  READY_FOR_PICKUP: null,
  OUT_FOR_DELIVERY: null,
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

/** Logs this kitchen into the real backend (same one zomo-merchant-app uses)
 * using the plaintext password already shown on the demo login list. */
function useRealMerchantSession(email?: string) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!email) return;
    const login = merchantHasRealSession()
      ? Promise.resolve()
      : (() => {
          const acct = STAFF_ACCOUNTS.find((a) => a.email === email);
          if (!acct) return Promise.reject(new Error("no matching real account"));
          return merchantRealLogin(acct.email, acct.password).then(() => undefined);
        })();
    login
      .then(() => merchantRealGetMyRestaurant())
      .then((r) => {
        setRestaurant(r);
        setReady(true);
      })
      .catch((err) => console.warn("[merchant] no real backend account for this demo login, staying local-only:", err));
  }, [email]);

  return { restaurant, ready };
}

function Kitchen() {
  const { staff } = useZoomo();
  const { restaurant, ready } = useRealMerchantSession(staff?.email);
  const [tab, setTab] = useState<"tickets" | "menu">("tickets");
  const [orders, setOrders] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadOrders = () => {
    if (!ready || !restaurant?.id) return;
    merchantRealGetOrders(restaurant.id)
      .then(setOrders)
      .catch((err) => console.warn("[merchant] could not load orders:", err));
  };
  const loadDishes = () => {
    if (!ready) return;
    merchantRealGetDishes()
      .then(setDishes)
      .catch((err) => console.warn("[merchant] could not load dishes:", err));
  };

  useEffect(() => {
    if (!ready) return;
    loadOrders();
    loadDishes();
    const t = setInterval(loadOrders, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, restaurant?.id]);

  if (!ready) {
    return <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">Connecting to the kitchen network…</p>;
  }

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
          {dishes.map((d) => {
            const off = !d.isAvailable;
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-card">
                <FoodImg src={d.imageUrl} alt="" className="size-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                  <p className="text-xs text-muted">{inr(d.price)}</p>
                </div>
                <button
                  disabled={busy === d.id}
                  onClick={() => {
                    setBusy(d.id);
                    merchantRealToggleDish(d.id)
                      .then(loadDishes)
                      .catch((err) => console.warn("[merchant] toggle failed:", err))
                      .finally(() => setBusy(null));
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${off ? "bg-danger/10 text-danger" : "bg-sage text-primary"}`}
                >
                  {off ? "Sold out" : "Live"}
                </button>
              </div>
            );
          })}
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No tickets yet. Place a customer order and it lands here.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = o.status;
            const flow = FLOW[st];
            return (
              <div key={o.id} className="rounded-[24px] bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{restaurant?.name} · #{o.id.slice(0, 8)}</p>
                    <p className="mt-1 text-lg font-bold text-ink">{o.user?.name || "Guest"}</p>
                    <p className="text-xs text-sub">{o.user?.phone || o.address?.street || "Jourian"}</p>
                  </div>
                  <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-bold text-primary">{st}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-sub">
                  {(o.items ?? []).map((i: any) => (
                    <li key={i.id} className="flex justify-between">
                      <span>
                        {i.dish?.name ?? "Item"} × {i.quantity}
                      </span>
                      <span className="tabular">{inr(i.price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {o.orderType === "DELIVERY" && st !== "CANCELLED" && st !== "DELIVERED" && (
                  <div className="mt-4 flex gap-2">
                    {flow && (
                      <button
                        disabled={busy === o.id}
                        onClick={() => {
                          setBusy(o.id);
                          merchantRealUpdateOrderStatus(restaurant.id, o.id, flow.next)
                            .then(loadOrders)
                            .catch((err) => console.warn("[merchant] status update failed:", err))
                            .finally(() => setBusy(null));
                        }}
                        className="btn-primary h-11 flex-1 text-sm"
                      >
                        {flow.label}
                      </button>
                    )}
                    {(st === "PENDING" || st === "CONFIRMED" || st === "PREPARING") && (
                      <button
                        disabled={busy === o.id}
                        onClick={() => {
                          setBusy(o.id);
                          merchantRealCancelOrder(restaurant.id, o.id)
                            .then(loadOrders)
                            .catch((err) => console.warn("[merchant] cancel failed:", err))
                            .finally(() => setBusy(null));
                        }}
                        className="btn-ghost h-11 px-4 text-sm text-danger"
                      >
                        Cancel
                      </button>
                    )}
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
