import { useEffect, useState } from "react";
import adminApi from "../services/adminApi";
import { FiTruck, FiRefreshCw } from "react-icons/fi";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchDrivers() {
    try {
      setLoading(true);
      const res = await adminApi.get("drivers");
      setDrivers(res.data);
    } catch {
      alert("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDrivers(); }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Drivers</h2>
          <p className="text-z-muted text-sm mt-1">{drivers.length} registered drivers</p>
        </div>
        <button
          onClick={fetchDrivers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm"
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers", value: drivers.length },
          { label: "Online", value: drivers.filter(d => d.isAvailable).length },
          { label: "Offline", value: drivers.filter(d => !d.isAvailable).length },
          { label: "Active Orders", value: drivers.filter(d => d.activeOrderCount > 0).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-z-surface border border-z-line rounded-card p-4 shadow-card">
            <p className="text-2xl font-bold text-z-ink">{stat.value}</p>
            <p className="text-z-muted text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-4 text-z-muted font-medium">Driver</th>
                <th className="px-6 py-4 text-z-muted font-medium">Vehicle</th>
                <th className="px-6 py-4 text-z-muted font-medium">Status</th>
                <th className="px-6 py-4 text-z-muted font-medium">Active Orders</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-z-muted">
                    Loading drivers...
                  </td>
                </tr>
              )}
              {!loading && drivers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-z-muted">
                    No drivers found
                  </td>
                </tr>
              )}
              {!loading && drivers.map((driver) => (
                <tr key={driver.id} className="border-t border-z-line-soft hover:bg-z-page transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-z-sage border border-z-primary/30 flex items-center justify-center text-z-primary font-semibold text-sm">
                        {driver.user?.name?.[0] || "D"}
                      </div>
                      <span className="text-z-ink font-medium">
                        {driver.user?.name || "Unknown Driver"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-z-sub">
                    {driver.vehicleType || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {driver.isAvailable ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-z-sage text-z-primary border border-z-accent/20">
                        Online
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-z-page text-z-muted border border-z-line">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-z-sub">
                    {driver.activeOrderCount ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
