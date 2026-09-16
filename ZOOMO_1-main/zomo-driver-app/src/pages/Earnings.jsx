import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiClock, FiPackage, FiTrendingUp } from "react-icons/fi";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { fetchDeliveryHistory } from "../services/driverApi";

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function EarningsChart({ days }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  return (
    <div className="rounded-card p-5 shadow-card bg-z-surface">
      <h3 className="text-z-ink font-semibold mb-4">Last 7 days</h3>
      <div className="flex items-end gap-1.5 h-36">
        {days.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
              <div
                className="w-full bg-z-primary rounded-t hover:bg-z-hover transition-all"
                style={{ height: `${Math.max((d.amount / max) * 120, 2)}px` }}
                title={`₹${d.amount.toFixed(0)} · ${d.count} deliveries`}
              />
            </div>
            <span className="text-z-muted text-[10px]">{d.date.slice(-2).replace(/^0/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Earnings() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeliveryHistory()
      .then(setHistory)
      .catch(() => setError("Failed to load earnings"));
  }, []);

  const stats = useMemo(() => {
    if (!history) return null;
    const delivered = history.filter((o) => o.status === "DELIVERED");
    const today = dayKey(new Date());

    const pay = (o) => o.deliveryFee ?? o.total ?? 0;

    const todayEarnings = delivered
      .filter((o) => o.actualDeliveryTime && dayKey(o.actualDeliveryTime) === today)
      .reduce((s, o) => s + pay(o), 0);

    const weekEarnings = delivered.reduce((s, o) => s + pay(o), 0);

    const buckets = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(dayKey(d), { date: dayKey(d), amount: 0, count: 0 });
    }
    for (const o of delivered) {
      if (!o.actualDeliveryTime) continue;
      const key = dayKey(o.actualDeliveryTime);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.amount += pay(o);
        bucket.count += 1;
      }
    }

    const onTimeEligible = delivered.filter((o) => o.estimatedDeliveryTime && o.actualDeliveryTime);
    const onTime = onTimeEligible.filter(
      (o) => new Date(o.actualDeliveryTime) <= new Date(o.estimatedDeliveryTime)
    );
    const onTimeRate = onTimeEligible.length ? Math.round((onTime.length / onTimeEligible.length) * 100) : null;

    return {
      todayEarnings,
      weekEarnings,
      totalDeliveries: delivered.length,
      onTimeRate,
      onTimeSample: onTimeEligible.length,
      days: Array.from(buckets.values()),
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Rider" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-z-sub mb-3">
          <FiChevronLeft size={16} /> Back
        </button>
        <p className="kicker mb-1">Earnings</p>
        <h1 className="display text-2xl text-z-ink mb-6">Your earnings & performance</h1>

        {error && <p className="text-sm text-z-danger">{error}</p>}
        {!stats ? (
          <p className="text-sm text-z-sub">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-card p-4 shadow-card bg-z-surface">
                <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                  <FiTrendingUp className="text-z-primary" size={18} />
                </div>
                <p className="display text-2xl text-z-ink">₹{stats.todayEarnings.toFixed(0)}</p>
                <p className="text-z-muted text-xs mt-1">Today's earnings</p>
              </div>
              <div className="rounded-card p-4 shadow-card bg-z-surface">
                <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                  <FiPackage className="text-z-primary" size={18} />
                </div>
                <p className="display text-2xl text-z-ink">₹{stats.weekEarnings.toFixed(0)}</p>
                <p className="text-z-muted text-xs mt-1">All-time earnings</p>
              </div>
            </div>

            <div className="mb-4">
              <EarningsChart days={stats.days} />
            </div>

            <div className="rounded-card p-5 shadow-card bg-z-surface mb-4">
              <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Performance</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="display text-xl text-z-ink">{stats.totalDeliveries}</p>
                  <p className="text-z-muted text-xs mt-1">Completed deliveries</p>
                </div>
                <div>
                  <p className="display text-xl text-z-ink">
                    {stats.onTimeRate === null ? "—" : `${stats.onTimeRate}%`}
                  </p>
                  <p className="text-z-muted text-xs mt-1">
                    {stats.onTimeRate === null ? "Not enough data yet" : "On-time rate"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Delivery history</p>
            <div className="space-y-3">
              {history.length === 0 && (
                <p className="rounded-card bg-z-surface p-8 text-center text-sm text-z-sub shadow-card">
                  No deliveries yet.
                </p>
              )}
              {history.map((o) => (
                <div key={o.id} className="rounded-card p-4 shadow-card bg-z-surface flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase truncate">
                      {o.restaurant?.name} · #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-sm font-bold text-z-ink truncate">
                      {o.address?.street || "—"}, {o.address?.city || ""}
                    </p>
                    <p className="text-xs text-z-sub flex items-center gap-1 mt-0.5">
                      <FiClock size={11} />
                      {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                      <span className={o.status === "CANCELLED" ? "text-z-danger" : "text-z-primary"}>
                        {o.status}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm font-bold text-z-ink shrink-0">₹{(o.deliveryFee ?? o.total).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
