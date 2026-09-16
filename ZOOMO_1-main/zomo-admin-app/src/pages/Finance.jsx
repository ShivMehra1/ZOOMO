import { useEffect, useState } from "react";
import { getBusinessSummary } from "../services/adminApi";
import { getAdminSocket } from "../lib/socket";
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiAward } from "react-icons/fi";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
      <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
        <Icon className="text-z-primary" size={18} />
      </div>
      <p className="text-2xl font-bold text-z-ink">{value}</p>
      <p className="text-z-muted text-xs mt-1">{label}</p>
      {sub && <p className="text-z-sub text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function RevenueSplitBar({ restaurant, platform, driver }) {
  const total = restaurant + platform + driver || 1;
  const pct = (v) => (v / total) * 100;

  const segments = [
    { label: "Restaurants", value: restaurant, cls: "bg-z-sage" },
    { label: "Platform (HQ)", value: platform, cls: "bg-z-primary" },
    { label: "Drivers", value: driver, cls: "bg-z-accent" },
  ];

  return (
    <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
      <h3 className="text-z-ink font-semibold mb-1">Item-price revenue split</h3>
      <p className="text-z-muted text-xs mb-4">70% restaurant / 25% platform / 5% driver commission, of item subtotal (delivery fees are separate and go entirely to drivers)</p>

      <div className="h-3 rounded-full overflow-hidden flex w-full bg-z-page mb-4">
        {segments.map((s) => (
          <div key={s.label} className={s.cls} style={{ width: `${pct(s.value)}%` }} title={`${s.label}: ₹${s.value.toFixed(0)}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {segments.map((s) => (
          <div key={s.label}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${s.cls}`} />
              <span className="text-z-muted text-xs">{s.label}</span>
            </div>
            <p className="text-z-ink font-semibold">₹{s.value.toFixed(0)}</p>
            <p className="text-z-sub text-[11px]">{pct(s.value).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Finance() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchSummary() {
    try {
      const res = await getBusinessSummary();
      setSummary(res.data);
    } catch {
      // keep last known summary on transient failure rather than blanking the page
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    const socket = getAdminSocket();
    const refresh = () => fetchSummary();
    socket.on("order:created", refresh);
    socket.on("order:updated", refresh);
    socket.on("payout:requested", refresh);
    socket.on("payout:updated", refresh);
    return () => {
      socket.off("order:created", refresh);
      socket.off("order:updated", refresh);
      socket.off("payout:requested", refresh);
      socket.off("payout:updated", refresh);
    };
  }, []);

  if (loading) {
    return <div className="text-z-muted text-sm py-12 text-center">Loading business summary...</div>;
  }
  if (!summary) return null;

  const driverEarningsTotal = summary.totalDeliveryFees + summary.totalDriverCommission;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-z-ink">Finance</h2>
        <p className="text-z-muted text-sm mt-1">Total business done and how it's split across the platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Total business" value={`₹${summary.totalBusiness.toFixed(0)}`} sub={`${summary.totalOrders} delivered orders`} />
        <StatCard icon={FiTrendingUp} label="Platform earnings" value={`₹${summary.totalPlatformEarnings.toFixed(0)}`} sub="25% of item revenue" />
        <StatCard icon={FiShoppingBag} label="Item revenue" value={`₹${summary.totalItemRevenue.toFixed(0)}`} sub="Before fees & tax" />
        <StatCard icon={FiAward} label="Paid to drivers" value={`₹${driverEarningsTotal.toFixed(0)}`} sub="Delivery fees + commission" />
      </div>

      <RevenueSplitBar
        restaurant={summary.totalRestaurantPayout}
        platform={summary.totalPlatformEarnings}
        driver={driverEarningsTotal}
      />

      <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
        <h3 className="text-z-ink font-semibold mb-4">Driver earnings leaderboard</h3>
        {summary.driverBreakdown.length === 0 ? (
          <p className="text-z-muted text-sm">No completed deliveries yet</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-2 pb-2 text-z-muted text-xs font-medium">
              <span>#</span>
              <span>Driver</span>
              <span>Deliveries</span>
              <span>Earnings</span>
            </div>
            {summary.driverBreakdown.map((d, i) => (
              <div key={d.driverId} className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 items-center px-2 py-2.5 rounded-xl hover:bg-z-page transition">
                <span className="w-6 h-6 rounded-full bg-z-sage text-z-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="text-z-ink text-sm font-medium">{d.name}</p>
                  <p className="text-z-muted text-xs">{d.email}</p>
                </div>
                <span className="text-z-sub text-sm tabular-nums">{d.deliveries}</span>
                <span className="text-z-primary text-sm font-semibold tabular-nums">₹{d.earnings.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
