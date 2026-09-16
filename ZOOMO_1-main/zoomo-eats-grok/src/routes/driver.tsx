import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { LiveRideMap } from "@/components/zoomo/live-ride-map";
import { inr, liveStatus, restaurantById, riderById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/driver")({ component: DriverPage });

function DriverPage() {
  return (
    <StaffShell role="DRIVER" title="Rider">
      <Jobs />
    </StaffShell>
  );
}

function Jobs() {
  const { staff, orders, setOrderLiveStatus, assignDriver } = useZoomo();
  const mineId = staff?.driverId;
  const pool = orders.filter((o) => {
    const st = liveStatus(o);
    if (o.orderType !== "DELIVERY") return false;
    if (st === "DELIVERED" || st === "CANCELLED") return o.driverId === mineId;
    if (o.driverId && o.driverId === mineId) return true;
    if (!o.driverId && (st === "READYFORPICKUP" || st === "PREPARING")) return true;
    return false;
  });

  if (pool.length === 0) {
    return <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No bags yet. When a kitchen marks ready, it shows here.</p>;
  }

  return (
    <div className="space-y-4">
      {pool.map((o) => {
        const st = liveStatus(o);
        const r = restaurantById(o.restaurantId);
        const rider = riderById(o.driverId || mineId);
        return (
          <div key={o.id} className="overflow-hidden rounded-[28px] bg-surface shadow-card">
            {(st === "OUTFORDELIVERY" || st === "DELIVERED") && (
              <div className="h-[240px]">
                <LiveRideMap
                  from={r?.area || "Jourian"}
                  to={o.address?.city || "Jourian"}
                  ride={st === "DELIVERED" ? 1 : 0.4}
                  showRider
                />
              </div>
            )}
            <div className="p-4">
              <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
                {r?.name} · #{o.id}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">{o.customerName || "Guest"}</p>
              <p className="text-xs text-sub">
                {o.address?.street || "Gate"} · {o.address?.city || "Jourian"} · {inr(o.total)}
              </p>
              {o.customerPhone && (
                <a href={`tel:+91${o.customerPhone}`} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary">
                  <Phone className="size-3.5" /> Call customer
                </a>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {!o.driverId && (
                  <button
                    className="btn-primary h-11 flex-1 text-sm"
                    onClick={() => {
                      assignDriver(o.id, mineId || rider?.id || "ravi");
                      setOrderLiveStatus(o.id, "OUTFORDELIVERY");
                    }}
                  >
                    Pick up bag
                  </button>
                )}
                {o.driverId === mineId && st === "READYFORPICKUP" && (
                  <button className="btn-primary h-11 flex-1 text-sm" onClick={() => setOrderLiveStatus(o.id, "OUTFORDELIVERY")}>
                    Picked up — riding
                  </button>
                )}
                {o.driverId === mineId && st === "OUTFORDELIVERY" && (
                  <button className="btn-primary h-11 flex-1 text-sm" onClick={() => setOrderLiveStatus(o.id, "DELIVERED")}>
                    Delivered at gate
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
