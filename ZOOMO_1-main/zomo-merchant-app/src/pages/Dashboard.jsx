// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const restaurantRes = await api.get("/merchant/restaurants/me");
        const restaurantId = restaurantRes?.data?.id;

        // ✅ FIX: a brand-new merchant has no restaurant yet.
        // Instead of crashing on `.id` of an undefined object,
        // send them to onboarding to create one.
        if (!restaurantId) {
          navigate("/onboarding", { replace: true });
          return;
        }

        const ordersRes = await api.get(
          `/merchant/restaurants/${restaurantId}/orders`
        );

        const dishesRes = await api.get("/merchant/dishes");

        const orders = ordersRes.data ?? [];
        const dishes = dishesRes.data ?? [];

        const today = new Date().toDateString();

        const todayOrders = orders.filter(
          (o) =>
            new Date(o.createdAt).toDateString() === today
        );

        const pendingOrders = orders.filter(
          (o) => o.status === "PENDING"
        );

        const revenueToday = todayOrders.reduce(
          (sum, o) => sum + o.total,
          0
        );

        setStats({
          totalOrdersToday: todayOrders.length,
          pendingOrders: pendingOrders.length,
          revenueToday,
          activeDishes: dishes.filter(
            (d) => d.isAvailable
          ).length,
        });

        setRecentOrders(
          orders.slice(0, 5).map((o) => ({
            id: o.id,
            customer: o.user?.name || "Customer",
            total: o.total,
            status: o.status,
          }))
        );
      } catch (err) {
        // ✅ FIX: if the restaurant lookup itself fails (404, network
        // error, etc.) treat it the same way — go to onboarding rather
        // than silently failing into a render crash.
        const status = err?.response?.status;
        if (status === 404) {
          navigate("/onboarding", { replace: true });
          return;
        }
        console.error("Dashboard load failed:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading dashboard...</p>;
  }

  // ✅ FIX: render a real error state instead of crashing on `stats.x`
  // when stats is null (e.g. an unexpected API failure).
  if (loadError || !stats) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-bold text-z-ink mb-2">
          Couldn't load dashboard
        </h2>
        <p className="text-sm text-z-sub mb-4">
          Something went wrong while fetching your restaurant data.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary h-11 px-5 text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker mb-1">Overview</p>
        <h1 className="display text-2xl text-z-ink">Dashboard</h1>
        <p className="text-sm text-z-sub mt-1">Overview of today's activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Orders Today" value={stats.totalOrdersToday} onClick={() => navigate("/orders")} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} highlight onClick={() => navigate("/orders")} />
        <StatCard title="Revenue Today" value={`₹${stats.revenueToday}`} />
        <StatCard title="Active Dishes" value={stats.activeDishes} onClick={() => navigate("/menu")} />
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-z-ink">Recent Orders</h2>
          <button onClick={() => navigate("/orders")} className="text-sm font-bold text-z-primary">
            View all
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-z-sub">No orders yet today.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex justify-between items-center text-sm bg-z-page rounded-xl px-4 py-3">
                <span className="text-z-ink font-medium">{o.customer}</span>
                <span className="flex items-center gap-3">
                  <span className="rounded-full bg-z-sage px-2.5 py-1 text-[11px] font-bold text-z-primary">
                    {o.status.replaceAll("_", " ")}
                  </span>
                  <span className="font-bold text-z-ink tabular-nums">₹{o.total}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Shortcut title="Manage Menu" desc="Add, edit or disable dishes" onClick={() => navigate("/menu")} />
        <Shortcut title="Restaurant Profile" desc="Update restaurant details" onClick={() => navigate("/restaurant")} />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value, onClick, highlight }) {
  return (
    <div
      onClick={onClick}
      className={`card p-5 transition ${onClick ? "cursor-pointer hover:shadow-lift" : ""} ${
        highlight ? "ring-2 ring-z-accent/40" : ""
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-z-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold text-z-ink">{value}</p>
    </div>
  );
}

function Shortcut({ title, desc, onClick }) {
  return (
    <div onClick={onClick} className="card p-5 cursor-pointer hover:shadow-lift transition">
      <h3 className="font-bold text-base mb-1 text-z-ink">{title}</h3>
      <p className="text-sm text-z-sub">{desc}</p>
    </div>
  );
}
