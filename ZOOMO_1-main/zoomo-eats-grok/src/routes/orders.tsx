import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Package } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { StatusPill, useTick } from "@/components/zoomo/tracker";
import { IMG, etaMinutes, inr, liveStatus, restaurantById, riderAssigned, riderById, riderFor } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const nav = useNavigate();
  const { orders, user, reorder, hydrated } = useZoomo();
  const [tab, setTab] = useState<"active" | "past">("active");
  useTick(2000);
  useEffect(() => {
    // Wait for the persisted store to rehydrate from localStorage before
    // deciding the user is logged out — on a hard page load `user` starts
    // as null for one tick even for an already-signed-in session, and
    // redirecting on that false signal was kicking real sessions to /login.
    if (hydrated && !user) nav({ to: "/login" });
  }, [hydrated, user, nav]);
  if (!hydrated || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }

  const active = orders.filter((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });
  const past = orders.filter((o) => {
    const s = liveStatus(o);
    return s === "DELIVERED" || s === "CANCELLED";
  });
  const list = tab === "active" ? active : past;

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-5 py-6">
        <BackBar title="Orders" to="/" />
        <div className="mb-5 flex rounded-full bg-sage p-1">
          {(["active", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-[13px] font-bold ${
                tab === t ? "bg-surface text-ink shadow-card" : "text-sub"
              }`}
            >
              {t === "active" ? `Active (${active.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-sage text-primary">
              <Package className="size-7" />
            </div>
            <p className="display mb-1 text-xl text-ink">{tab === "active" ? "Nothing moving" : "No past orders"}</p>
            <p className="mb-6 text-sm text-sub">
              {tab === "active" ? "Place a bag and you’ll watch it leave the kitchen." : "Your delivered and cancelled bags land here."}
            </p>
            <button onClick={() => nav({ to: "/restaurants" })} className="btn-primary px-5 py-2.5 text-sm">
              Browse kitchens
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((o) => {
              const r = restaurantById(o.restaurantId);
              const st = liveStatus(o);
              const rider =
                o.orderType === "DELIVERY" && riderAssigned(st)
                  ? o.driver ?? riderById(o.driverId) ?? riderFor(o.id)
                  : null;
              const eta = etaMinutes(o);
              return (
                <div key={o.id} className="w-full overflow-hidden rounded-[24px] bg-surface text-left shadow-card">
                  <button
                    type="button"
                    onClick={() => nav({ to: "/orders/$id", params: { id: o.id } })}
                    className="w-full text-left"
                  >
                  <div className="flex gap-3 p-3">
                    <img
                      src={r?.imageUrl || IMG.hero}
                      alt=""
                      className="size-[88px] shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[15px] font-bold text-ink">{o.restaurantName}</p>
                        <StatusPill status={st} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                      </p>
                      <p className="mt-2 text-sm font-bold text-primary tabular">{inr(o.total)}</p>
                      {tab === "active" && (
                        <p className="mt-1 text-xs font-medium text-sub">
                          {st === "OUTFORDELIVERY"
                            ? `${rider?.name ?? "Rider"} · ${eta} min`
                            : `${eta} min · ${r?.area ?? "Jourian"}`}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-8 size-4 shrink-0 text-muted" />
                  </div>
                  </button>
                  {tab === "active" && (
                    <button
                      type="button"
                      onClick={() => nav({ to: "/orders/$id", params: { id: o.id } })}
                      className="flex w-full items-center justify-between border-t border-line-soft px-4 py-2.5"
                    >
                      <span className="text-[12px] text-sub">
                        {rider ? `Picked up by ${rider.name}` : "Kitchen has the ticket"}
                      </span>
                      <span className="text-[12px] font-bold text-primary">Track</span>
                    </button>
                  )}
                  {tab === "past" && st !== "CANCELLED" && (
                    <div className="flex items-center justify-between border-t border-line-soft px-4 py-2.5">
                      <span className="text-[12px] text-sub">One-tap same bag</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (reorder(o.id) === "ok") nav({ to: "/cart" });
                        }}
                        className="rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-white"
                      >
                        Reorder
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
