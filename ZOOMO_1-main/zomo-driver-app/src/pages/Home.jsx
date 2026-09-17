import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../context/DriverAuthContext";
import { useState } from "react";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { updateAvailability } from "../services/driverApi";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    driver,
    updateDriverAvailabilityLocally,
  } = useDriverAuth();

  const isOnline = Boolean(driver?.isAvailable);

  const toggleAvailability = async () => {
    if (!driver) return;

    updateDriverAvailabilityLocally(!isOnline);

    try {
      setLoading(true);
      await updateAvailability(!isOnline);
    } catch {
      updateDriverAvailabilityLocally(isOnline);
      alert("Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Rider" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="kicker mb-1">Welcome</p>
        <h1 className="display text-[28px] text-z-ink mb-6">
          {driver?.name ?? "Driver"}
        </h1>

        <div
          className={`rounded-card p-6 mb-6 transition-all duration-300 ${
            isOnline
              ? "bg-z-sage text-z-ink shadow-glow"
              : "bg-z-surface border border-z-line-soft shadow-card"
          }`}
        >
          <p className={`text-[11px] font-bold tracking-wide uppercase mb-1 ${isOnline ? "text-z-primary/70" : "text-z-muted"}`}>
            Status
          </p>
          <h2 className="display text-[32px] mb-5 text-z-primary">
            {isOnline ? "Online" : "Offline"}
          </h2>

          <button
            onClick={toggleAvailability}
            disabled={loading}
            className={`w-full h-14 rounded-xl text-base font-bold transition active:scale-[0.98] disabled:opacity-60 ${
              isOnline
                ? "bg-z-surface text-z-primary shadow-card"
                : "bg-z-primary text-white hover:bg-z-hover"
            }`}
          >
            {loading ? "Updating..." : isOnline ? "Go offline" : "Go online"}
          </button>
        </div>

        <p className="text-center text-sm text-z-sub">
          {isOnline
            ? "You'll start receiving delivery requests"
            : "You must be online to receive delivery requests"}
        </p>

        {isOnline && (
          <button
            onClick={() => navigate("/orders")}
            className="btn-ghost mt-6 w-full h-12 text-sm"
          >
            View assigned orders
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
