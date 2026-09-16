import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StaffShell } from "@/components/zoomo/staff-shell";
import { inr } from "@/lib/zoomo-data";
import { STAFF_ACCOUNTS, useZoomo } from "@/lib/zoomo-store";
import {
  adminHasRealSession,
  adminRealAssignDriver,
  adminRealGetDrivers,
  adminRealGetOrders,
  adminRealLogin,
  adminRealUpdateOrderStatus,
} from "@/lib/real-api";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  return (
    <StaffShell role="ADMIN" title="HQ">
      <Hq />
    </StaffShell>
  );
}

/** Logs HQ into the real backend (same one zomo-admin-app uses) using the
 * plaintext password already shown on the demo login list. */
function useRealAdminSession(email?: string) {
  const [ready, setReady] = useState(adminHasRealSession());
  useEffect(() => {
    if (!email) return;
    if (adminHasRealSession()) {
      setReady(true);
      return;
    }
    const acct = STAFF_ACCOUNTS.find((a) => a.email === email);
    if (!acct) return;
    adminRealLogin(acct.email, acct.password)
      .then(() => setReady(true))
      .catch((err) => console.warn("[admin] no real backend account for this demo login, staying local-only:", err));
  }, [email]);
  return ready;
}

function Hq() {
  const { staff } = useZoomo();
  void staff;
  const ready = useRealAdminSession(staff?.email);
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    if (!ready) return;
    adminRealGetOrders()
      .then(setOrders)
      .catch((err) => console.warn("[admin] could not load orders:", err));
    adminRealGetDrivers()
      .then(setDrivers)
      .catch((err) => console.warn("[admin] could not load drivers:", err));
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

  const live = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Bags" value={String(orders.length)} />
        <Stat label="Live" value={String(live)} />
        <Stat label="Riders" value={String(drivers.length)} />
      </div>
      <div className="space-y-3">
        {orders.length === 0 && (
          <p className="rounded-[24px] bg-surface p-8 text-center text-sm text-sub">No orders yet.</p>
        )}
        {orders.map((o) => {
          const st = o.status;
          return (
            <div key={o.id} className="rounded-[24px] bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
                    {o.restaurant?.name} · #{o.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 font-bold text-ink">{o.user?.name || "Guest"} · {inr(o.total)}</p>
                  <p className="text-xs text-sub">{st}{o.driver ? ` · rider ${o.driver.user?.name ?? o.driverId}` : ""}</p>
                </div>
              </div>
              {st !== "DELIVERED" && st !== "CANCELLED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {drivers.map((d) => (
                    <button
                      key={d.id}
                      disabled={busy === o.id}
                      onClick={() => {
                        setBusy(o.id);
                        adminRealAssignDriver(o.id, d.id)
                          .then(load)
                          .catch((err) => console.warn("[admin] assign failed:", err))
                          .finally(() => setBusy(null));
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        o.driverId === d.id ? "bg-primary text-white" : "bg-sage text-primary"
                      }`}
                    >
                      {(d.user?.name ?? "Rider").split(" ")[0]}
                    </button>
                  ))}
                  <button
                    disabled={busy === o.id}
                    onClick={() => {
                      setBusy(o.id);
                      adminRealUpdateOrderStatus(o.id, "CANCELLED")
                        .then(load)
                        .catch((err) => console.warn("[admin] cancel failed:", err))
                        .finally(() => setBusy(null));
                    }}
                    className="rounded-full px-3 py-1.5 text-[11px] font-bold text-danger"
                  >
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
