import { createFileRoute } from "@tanstack/react-router";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { RIDERS, inr, liveStatus, restaurantById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  return (
    <StaffShell role="ADMIN" title="HQ">
      <Hq />
    </StaffShell>
  );
}

function Hq() {
  const { orders, assignDriver, setOrderLiveStatus, staff } = useZoomo();
  void staff;

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Bags" value={String(orders.length)} />
        <Stat label="Live" value={String(orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(liveStatus(o))).length)} />
        <Stat label="Riders" value={String(RIDERS.length)} />
      </div>
      <div className="space-y-3">
        {orders.length === 0 && (
          <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No orders yet.</p>
        )}
        {orders.map((o) => {
          const st = liveStatus(o);
          const r = restaurantById(o.restaurantId);
          return (
            <div key={o.id} className="rounded-[24px] bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
                    {r?.name} · #{o.id}
                  </p>
                  <p className="mt-1 font-bold text-ink">{o.customerName || "Guest"} · {inr(o.total)}</p>
                  <p className="text-xs text-sub">{st}{o.driverId ? ` · rider ${o.driverId}` : ""}</p>
                </div>
              </div>
              {st !== "DELIVERED" && st !== "CANCELLED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {RIDERS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => assignDriver(o.id, d.id)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        o.driverId === d.id ? "bg-primary text-white" : "bg-sage text-primary"
                      }`}
                    >
                      {d.name.split(" ")[0]}
                    </button>
                  ))}
                  <button onClick={() => setOrderLiveStatus(o.id, "CANCELLED")} className="rounded-full px-3 py-1.5 text-[11px] font-bold text-danger">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-surface p-4 shadow-card">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}
