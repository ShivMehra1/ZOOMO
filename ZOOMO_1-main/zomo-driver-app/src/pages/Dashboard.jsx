import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { fetchDriverDashboard } from "../services/driverApi";
import { FiTrendingUp, FiPackage, FiChevronRight } from "react-icons/fi";
import { formatWhen } from "../lib/when";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDriverDashboard()
      .then(setStats)
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Rider" />

      {loading ? (
        <p className="text-center text-sm text-z-sub mt-20">Loading dashboard...</p>
      ) : error ? (
        <p className="text-center text-sm text-z-danger mt-20">{error}</p>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-6">
          <p className="kicker mb-1">Today</p>
          <h1 className="display text-2xl text-z-ink mb-1">
            Today's performance
          </h1>
          <p className="text-sm text-z-sub mb-6">
            Your delivery summary for today
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-card p-4 shadow-card bg-z-surface">
              <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                <FiPackage className="text-z-primary" size={18} />
              </div>
              <p className="display text-2xl text-z-ink">
                {stats.totalOrders}
              </p>
              <p className="text-z-muted text-xs mt-1">Orders delivered</p>
            </div>

            <div className="rounded-card p-4 shadow-card bg-z-surface">
              <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                <FiTrendingUp className="text-z-primary" size={18} />
              </div>
              <p className="display text-2xl text-z-ink">
                ₹{stats.totalEarnings}
              </p>
              <p className="text-z-muted text-xs mt-1">Earnings</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/earnings")}
            className="w-full rounded-card p-4 shadow-card bg-z-surface flex items-center justify-between mb-6"
          >
            <span className="text-sm font-bold text-z-ink">View earnings, performance & history</span>
            <FiChevronRight className="text-z-muted" size={18} />
          </button>

          {stats.lastDeliveryAt && (
            <div className="rounded-card p-4 shadow-card bg-z-surface text-center">
              <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">
                Last delivery completed at
              </p>
              <p className="mt-1 font-bold text-z-ink">
                {formatWhen(stats.lastDeliveryAt)}
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
