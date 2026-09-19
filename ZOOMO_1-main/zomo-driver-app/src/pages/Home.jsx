import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../context/DriverAuthContext";
import { useState } from "react";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import GreenSwitch from "../components/GreenSwitch";
import { updateAvailability } from "../services/driverApi";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { driver, updateDriverAvailabilityLocally } = useDriverAuth();
  const isOnline = Boolean(driver?.isAvailable);
  const name = driver?.name || driver?.user?.name || "Driver";

  const toggleAvailability = async () => {
    if (!driver) return;
    updateDriverAvailabilityLocally(!isOnline);
    try {
      setLoading(true);
      await updateAvailability(!isOnline);
    } catch {
      updateDriverAvailabilityLocally(isOnline);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Driver" />

      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="kicker mb-1">Welcome</p>
        <h1 className="display text-[28px] text-z-ink mb-6">{name}</h1>

        <div
          className={`rounded-card p-6 mb-6 transition-all duration-300 ${
            isOnline
              ? "bg-z-sage text-z-ink shadow-glow"
              : "bg-z-surface border border-z-line-soft shadow-card"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-[11px] font-bold tracking-wide uppercase mb-1 ${isOnline ? "text-z-primary/70" : "text-z-muted"}`}>
                Status
              </p>
              <h2 className="display text-[32px] text-z-primary">
                {isOnline ? "Online" : "Offline"}
              </h2>
            </div>
            <GreenSwitch
              size="lg"
              on={isOnline}
              onToggle={toggleAvailability}
              label={isOnline ? "Go offline" : "Go online"}
              disabled={loading}
            />
          </div>
        </div>

        <p className="text-center text-sm text-z-sub">
          {isOnline
            ? "You'll start receiving delivery requests"
            : "You must be online to receive delivery requests"}
        </p>

        <div className="relative mt-6 h-44 overflow-hidden rounded-[24px] bg-z-sage">
          <iframe
            title="Jourian"
            src="https://maps.google.com/maps?ll=32.834,74.577&z=14&hl=en&output=embed&iwloc="
            className="absolute -top-12 -left-8 h-[calc(100%+6rem)] w-[calc(100%+4rem)] max-w-none border-0"
          />
        </div>

        {isOnline && (
          <button
            onClick={() => navigate("/orders")}
            className="btn-ghost mt-6 w-full h-12 text-sm"
          >
            View deliveries
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
