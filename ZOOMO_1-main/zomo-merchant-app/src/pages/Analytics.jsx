import { useEffect, useState } from "react";
import api from "../services/api";

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
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
    <div className="card p-5">
      <h3 className="text-z-ink font-bold mb-4">Revenue — last {data.length} days</h3>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: "140px" }}>
              <div
                className="w-full bg-z-primary rounded-t hover:bg-z-hover transition-all"
                style={{ height: `${Math.max((d.revenue / max) * 140, 2)}px` }}
                title={`${d.date}: ₹${d.revenue.toFixed(0)} (${d.orders} orders)`}
              />
            </div>
            <span className="text-z-muted text-[10px]">{d.date.slice(-2).replace(/^0/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeakHoursChart({ hours }) {
  const max = Math.max(...hours.map((h) => h.orders), 1);
  return (
    <div className="card p-5">
      <h3 className="text-z-ink font-bold mb-4">Peak order hours</h3>
      <div className="flex items-end gap-1 h-32">
        {hours.map((h) => (
          <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full flex items-end justify-center" style={{ height: "110px" }}>
              <div
                className="w-full bg-z-accent rounded-t"
                style={{ height: `${Math.max((h.orders / max) * 110, 2)}px` }}
                title={`${h.label}: ${h.orders} orders`}
              />
            </div>
            {h.hour % 6 === 0 && <span className="text-z-muted text-[9px]">{h.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get("/merchant/restaurants/me");
        const restaurantId = meRes.data?.id;

        const [ordersRes, dishesRes] = await Promise.all([
          api.get(`/merchant/restaurants/${restaurantId}/orders`),
          api.get("/merchant/dishes"),
        ]);

        const orders = (ordersRes.data ?? []).filter((o) => o.status !== "CANCELLED");
        const dishes = dishesRes.data ?? [];

        // Revenue timeseries — last 14 days, inclusive of today
        const days = 14;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (days - 1));
        cutoff.setHours(0, 0, 0, 0);
        const buckets = new Map();
        for (let i = 0; i < days; i++) {
          const d = new Date(cutoff);
          d.setDate(d.getDate() + i);
          buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
        }
        for (const o of orders) {
          const key = new Date(o.createdAt).toISOString().slice(0, 10);
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.revenue += o.total;
            bucket.orders += 1;
          }
        }
        const revenueSeries = Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
        setRevenue(revenueSeries);

        // Peak hours — bucket by hour of day across all orders
        const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          label: hour.toString().padStart(2, "0"),
          orders: 0,
        }));
        for (const o of orders) {
          const hour = new Date(o.createdAt).getHours();
          hourBuckets[hour].orders += 1;
        }
        setPeakHours(hourBuckets);

        // Best-selling dishes — aggregate order items by dish
        const dishTotals = new Map();
        for (const o of orders) {
          for (const item of o.items ?? []) {
            const key = item.dish?.id ?? item.dishId;
            if (!key) continue;
            const t = dishTotals.get(key) || { name: item.dish?.name ?? "Dish", qty: 0, revenue: 0 };
            t.qty += item.quantity;
            t.revenue += item.price * item.quantity;
            dishTotals.set(key, t);
          }
        }
        const ranked = Array.from(dishTotals.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
        setTopDishes(ranked);

        const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
        setSummary({
          totalOrders: orders.length,
          totalRevenue,
          avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
          activeDishes: dishes.filter((d) => d.isAvailable).length,
        });
      } catch (err) {
        setLoadError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading analytics...</p>;
  }

  if (loadError || !summary) {
    return (
      <div className="card p-6">
        <p className="text-sm text-z-danger">{loadError || "Something went wrong"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker mb-1">Insights</p>
        <h1 className="display text-2xl text-z-ink">Analytics</h1>
        <p className="text-sm text-z-sub mt-1">How your restaurant is performing</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${summary.totalRevenue.toFixed(0)}`} />
        <StatCard label="Total Orders" value={summary.totalOrders} />
        <StatCard label="Avg Order Value" value={`₹${summary.avgOrderValue.toFixed(0)}`} />
        <StatCard label="Active Dishes" value={summary.activeDishes} />
      </div>

      <RevenueChart data={revenue} />
      <PeakHoursChart hours={peakHours} />

      <div className="card p-5">
        <h3 className="text-z-ink font-bold mb-4">Best-selling dishes</h3>
        {topDishes.length === 0 ? (
          <p className="text-sm text-z-sub">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {topDishes.map((d, i) => (
              <div key={d.name + i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-z-sage text-z-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-z-ink text-sm font-medium">{d.name}</p>
                    <p className="text-z-muted text-xs">{d.qty} sold</p>
                  </div>
                </div>
                <span className="text-z-primary text-sm font-bold">₹{d.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
