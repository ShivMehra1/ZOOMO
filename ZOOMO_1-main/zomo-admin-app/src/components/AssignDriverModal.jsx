import { useEffect, useState } from "react";
import adminApi, { assignDriver } from "../services/adminApi";

export default function AssignDriverModal({ order, onClose, onAssigned }) {
  // 🛑 HARD SAFETY GUARD — prevents full-screen lock
  if (!order) return null;

  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      const res = await adminApi.get("/drivers");
      setDrivers(res.data);
    } catch {
      alert("Failed to load drivers");
    }
  }

  const filteredDrivers = drivers.filter(
    (d) =>
      d.isAvailable &&
      d.user?.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  async function handleConfirm() {
    if (!selectedDriver || loading) return;

    try {
      setLoading(true);
      await assignDriver(order.id, selectedDriver.id);
      onAssigned?.();
      onClose?.();
    } catch (error) {
      alert(
        error?.response?.data?.message || "Failed to assign driver"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose} // click outside closes modal
    >
      <div
        className="bg-z-surface w-full max-w-lg rounded-card p-6 space-y-5 shadow-card"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click
      >
        <h3 className="text-xl font-semibold text-z-ink">
          Assign Driver – {order.id}
        </h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-z-line bg-z-page text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
        />

        {/* Driver list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredDrivers.length === 0 && (
            <p className="text-sm text-z-muted">
              No available drivers found
            </p>
          )}

          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              onClick={() => setSelectedDriver(driver)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer
                ${
                  selectedDriver?.id === driver.id
                    ? "border-z-primary bg-z-sage"
                    : "border-z-line"
                }`}
            >
              <div>
                <p className="font-medium text-z-ink">
                  {driver.user?.name}
                </p>
                <p className="text-sm text-z-muted">
                  {driver.vehicleType || "-"}
                </p>
              </div>

              <input
                type="radio"
                checked={selectedDriver?.id === driver.id}
                readOnly
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-z-sub hover:text-z-ink"
          >
            Cancel
          </button>

          <button
            disabled={!selectedDriver || loading}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-medium
              ${
                selectedDriver && !loading
                  ? "bg-z-primary text-white hover:bg-z-hover"
                  : "bg-z-line text-z-muted cursor-not-allowed"
              }`}
          >
            {loading ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
