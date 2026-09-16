import { useEffect, useState } from "react";
import {
  getAnalyticsSummary,
  getRevenueTimeseries,
  getTopRestaurants,
  getTopDishes,
} from "../services/adminApi";
import { FiDollarSign, FiShoppingBag, FiUsers, FiTruck, FiTrendingUp, FiXCircle } from "react-icons/fi";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center">
          <Icon className="text-z-primary" size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-z-ink">{value}</p>
      <p className="text-z-muted text-xs mt-1">{label}</p>
      {sub && <p className="text-z-sub text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
      <h3 className="text-z-ink font-semibold mb-4">Revenue — last {data.length} days</h3>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full flex items-end justify-center" style={{ height: "140px" }}>
              <div
                className="w-full bg-z-primary rounded-t hover:bg-z-hover transition-all"
                style={{ height: `${Math.max((d.revenue / max) * 140, 2)}px` }}
                title={`${d.date}: ₹${d.revenue.toFixed(0)} (${d.orders} orders)`}
              />
            </div>
            <span className="text-z-muted text-[10px] rotate-0">
              {d.date.slice(-2).replace(/^0/, "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getRevenueTimeseries(14),
      getTopRestaurants(5),
      getTopDishes(5),
    ])
      .then(([s, r, tr, td]) => {
        setSummary(s.data);
        setRevenue(r.data);
        setTopRestaurants(tr.data);
        setTopDishes(td.data);
      })
      .catch(() => alert("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-z-muted text-sm py-12 text-center">Loading analytics...</div>;
  }
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-z-ink">Analytics</h2>
        <p className="text-z-muted text-sm mt-1">Business performance overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Total Revenue" value={`₹${summary.totalRevenue.toFixed(0)}`} sub={`₹${summary.revenueToday.toFixed(0)} today`} />
        <StatCard icon={FiShoppingBag} label="Total Orders" value={summary.totalOrders} sub={`${summary.ordersToday} today`} />
        <StatCard icon={FiUsers} label="Total Users" value={summary.totalUsers} sub={`${summary.totalRestaurants} restaurants`} />
        <StatCard icon={FiTruck} label="Drivers" value={summary.totalDrivers} sub={`${summary.activeDrivers} online`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FiTrendingUp} label="Avg Order Value" value={`₹${summary.totalOrders ? (summary.totalRevenue / summary.totalOrders).toFixed(0) : 0}`} />
        <StatCard icon={FiXCircle} label="Cancellation Rate" value={`${summary.cancellationRate}%`} sub={`${summary.cancelledOrders} cancelled`} />
      </div>

      <RevenueChart data={revenue} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
          <h3 className="text-z-ink font-semibold mb-4">Top Restaurants</h3>
          <div className="space-y-3">
            {topRestaurants.map((r, i) => (
              <div key={r.restaurant?.id || i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-z-sage text-z-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-z-ink text-sm font-medium">{r.restaurant?.name || "Unknown"}</p>
                    <p className="text-z-muted text-xs">{r.orderCount} orders</p>
                  </div>
                </div>
                <span className="text-z-primary text-sm font-semibold">₹{r.revenue.toFixed(0)}</span>
              </div>
            ))}
            {topRestaurants.length === 0 && <p className="text-z-muted text-sm">No data yet</p>}
          </div>
        </div>

        <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
          <h3 className="text-z-ink font-semibold mb-4">Top Dishes</h3>
          <div className="space-y-3">
            {topDishes.map((d, i) => (
              <div key={d.dish?.id || i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-z-sage text-z-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-z-ink text-sm font-medium">{d.dish?.name || "Unknown"}</p>
                    <p className="text-z-muted text-xs">{d.dish?.restaurant?.name} · {d.qtySold} sold</p>
                  </div>
                </div>
                <span className="text-z-primary text-sm font-semibold">₹{d.revenue.toFixed(0)}</span>
              </div>
            ))}
            {topDishes.length === 0 && <p className="text-z-muted text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
