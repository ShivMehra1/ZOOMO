import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { LiveRideMap } from "@/components/zoomo/live-ride-map";
import { inr } from "@/lib/zoomo-data";
import { STAFF_ACCOUNTS, useZoomo } from "@/lib/zoomo-store";
import { driverRealDeliver, driverRealGetOrders, driverRealLogin, driverRealPickup, driverHasRealSession } from "@/lib/real-api";

export const Route = createFileRoute("/driver")({ component: DriverPage });

function DriverPage() {
  return (
    <StaffShell role="DRIVER" title="Rider">
      <Jobs />
    </StaffShell>
  );
}

/** Logs this rider into the real backend (same one zomo-driver-app uses) using
 * the plaintext password already shown on the demo login list — this app has
 * no real password entry step of its own, it reuses the mock-store's staff
 * session as the gate and layers a real JWT on top for real data/actions. */
function useRealDriverSession(email?: string) {
  const [ready, setReady] = useState(driverHasRealSession());
  useEffect(() => {
    if (!email) return;
    if (driverHasRealSession()) {
      setReady(true);
      return;
    }
    const acct = STAFF_ACCOUNTS.find((a) => a.email === email);
    if (!acct) return;
    driverRealLogin(acct.email, acct.password)
      .then(() => setReady(true))
      .catch((err) => console.warn("[driver] no real backend account for this demo login, staying local-only:", err));
  }, [email]);
  return ready;
}

function Jobs() {
  const { staff } = useZoomo();
  const ready = useRealDriverSession(staff?.email);
  const [orders, setOrders] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    if (!ready) return;
    driverRealGetOrders()
      .then(setOrders)
      .catch((err) => console.warn("[driver] could not load orders:", err));
  };

  useEffect(() => {
    if (!ready) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">Connecting to the kitchen network…</p>;
  }

  if (orders.length === 0) {
    return <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No bags yet. When HQ assigns you a delivery, it shows here.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const st = o.status;
        return (
          <div key={o.id} className="overflow-hidden rounded-[28px] bg-surface shadow-card">
            {st === "OUT_FOR_DELIVERY" && (
              <div className="h-[240px]">
                <LiveRideMap from={o.restaurant?.address || "Jourian"} to={o.address?.city || "Jourian"} ride={0.4} showRider />
              </div>
            )}
            <div className="p-4">
              <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
                {o.restaurant?.name} · #{o.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">{o.user?.name || "Guest"}</p>
              <p className="text-xs text-sub">
                {o.address?.street || "Gate"} · {o.address?.city || "Jourian"} · {inr(o.total)}
              </p>
              {o.user?.phone && (
                <a href={`tel:+91${o.user.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary">
                  <Phone className="size-3.5" /> Call customer
                </a>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {st === "READY_FOR_PICKUP" && (
                  <button
                    className="btn-primary h-11 flex-1 text-sm"
                    disabled={busy === o.id}
                    onClick={() => {
                      setBusy(o.id);
                      driverRealPickup(o.id)
                        .then(load)
                        .catch((err) => console.warn("[driver] pickup failed:", err))
                        .finally(() => setBusy(null));
                    }}
                  >
                    Picked up — riding
                  </button>
                )}
                {st === "OUT_FOR_DELIVERY" && (
                  <button
                    className="btn-primary h-11 flex-1 text-sm"
                    disabled={busy === o.id}
                    onClick={() => {
                      setBusy(o.id);
                      driverRealDeliver(o.id)
                        .then(load)
                        .catch((err) => console.warn("[driver] deliver failed:", err))
                        .finally(() => setBusy(null));
                    }}
                  >
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
