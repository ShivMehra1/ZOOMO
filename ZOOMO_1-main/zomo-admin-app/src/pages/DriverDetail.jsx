import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDriverById,
  suspendUser,
  unsuspendUser,
  resetUserPassword,
} from "../services/adminApi";
import { FiArrowLeft, FiRefreshCw, FiKey, FiSlash, FiCheckCircle, FiCopy, FiTruck } from "react-icons/fi";

const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  READY_FOR_PICKUP: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 border-orange-200",
  DELIVERED: "bg-z-sage text-z-primary border-z-accent/20",
  CANCELLED: "bg-red-50 text-z-danger border-red-200",
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-card border border-z-line bg-z-surface p-4 shadow-card">
      <p className="text-z-muted text-xs font-medium">{label}</p>
      <p className="text-z-ink text-xl font-bold mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-z-muted text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DriverDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await getDriverById(id);
      setDriver(res.data);
    } catch {
      alert("Failed to load driver");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleResetPassword() {
    if (!confirm("Generate a new temporary password for this driver? Their current password stops working immediately.")) return;
    try {
      setBusy(true);
      const res = await resetUserPassword(driver.user.id);
      setTempPassword(res.data.tempPassword);
    } catch {
      alert("Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  async function handleSuspend() {
    try {
      setBusy(true);
      await suspendUser(driver.user.id, suspendReason);
      setShowSuspendForm(false);
      setSuspendReason("");
      await load();
    } catch {
      alert("Failed to suspend driver");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsuspend() {
    try {
      setBusy(true);
      await unsuspendUser(driver.user.id);
      await load();
    } catch {
      alert("Failed to unsuspend driver");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !driver) {
    return <div className="px-6 py-16 text-center text-z-muted">Loading driver...</div>;
  }
  if (!driver) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav("/admin/drivers")}
          className="flex size-9 items-center justify-center rounded-full border border-z-line bg-z-surface text-z-sub hover:text-z-primary transition"
          aria-label="Back to drivers"
        >
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-z-sage border border-z-primary/30 flex items-center justify-center text-z-primary font-semibold overflow-hidden">
            {driver.user?.avatarUrl ? (
              <img src={driver.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              driver.user?.name?.[0] || "D"
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-z-ink">{driver.user?.name || "Unknown Driver"}</h2>
            <p className="text-z-muted text-sm">{driver.user?.email} · {driver.user?.phone || "no phone"}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {driver.isAvailable ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-sage text-z-primary border border-z-accent/20">Online</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-muted border border-z-line">Offline</span>
        )}
        {driver.user?.isSuspended ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">
            Suspended{driver.user.suspendedReason ? `: ${driver.user.suspendedReason}` : ""}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>
        )}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-sub border border-z-line">
          <FiTruck size={12} /> {driver.vehicleType || "—"} {driver.vehiclePlate ? `· ${driver.vehiclePlate}` : ""}
        </span>
        {driver.rating != null && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-sub border border-z-line">
            ★ {driver.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Deliveries" value={driver.totalDeliveries} />
        <StatCard label="Total earned" value={`₹${driver.totalEarned.toFixed(0)}`} sub="Delivery fee + 5% commission" />
        <StatCard label="Available balance" value={`₹${driver.balance.toFixed(0)}`} sub="Not yet paid out" />
        <StatCard label="Joined" value={new Date(driver.user.createdAt).toLocaleDateString()} />
      </div>

      {tempPassword && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-amber-800 text-sm font-medium">New temporary password (shown once — relay it to the driver now):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono text-z-ink">{tempPassword}</code>
            <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="p-2 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-100" title="Copy">
              <FiCopy size={14} />
            </button>
          </div>
        </div>
      )}

      {showSuspendForm && (
        <div className="space-y-2 bg-z-surface border border-z-line rounded-card p-4">
          <input
            type="text"
            placeholder="Reason for suspension"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-z-line bg-z-page text-sm text-z-ink"
          />
          <div className="flex gap-2">
            <button onClick={handleSuspend} disabled={busy} className="px-4 py-2 rounded-lg bg-z-danger text-white text-sm font-medium disabled:opacity-50">
              Confirm suspend
            </button>
            <button onClick={() => setShowSuspendForm(false)} className="px-4 py-2 rounded-lg text-z-sub text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={handleResetPassword} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-primary hover:bg-z-hover text-white text-sm font-medium transition disabled:opacity-50">
          <FiKey size={14} /> Reset password
        </button>
        {driver.user?.isSuspended ? (
          <button onClick={handleUnsuspend} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium transition disabled:opacity-50">
            <FiCheckCircle size={14} /> Unsuspend
          </button>
        ) : (
          <button onClick={() => setShowSuspendForm(true)} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-z-danger border border-red-200 text-sm font-medium transition disabled:opacity-50">
            <FiSlash size={14} /> Suspend
          </button>
        )}
      </div>

      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-z-line">
          <h3 className="text-z-ink font-semibold">Recent deliveries ({driver.orders.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-3 text-z-muted font-medium">Order ID</th>
                <th className="px-6 py-3 text-z-muted font-medium">Restaurant</th>
                <th className="px-6 py-3 text-z-muted font-medium">Total</th>
                <th className="px-6 py-3 text-z-muted font-medium">Earned</th>
                <th className="px-6 py-3 text-z-muted font-medium">Status</th>
                <th className="px-6 py-3 text-z-muted font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {driver.orders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-z-muted">No deliveries yet</td></tr>
              )}
              {driver.orders.map((o) => (
                <tr key={o.id} className="border-t border-z-line-soft">
                  <td className="px-6 py-3 text-z-sub font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="px-6 py-3 text-z-ink">{o.restaurant?.name || "—"}</td>
                  <td className="px-6 py-3 text-z-ink font-medium tabular-nums">₹{o.total.toFixed(0)}</td>
                  <td className="px-6 py-3 text-z-sub tabular-nums">₹{((o.deliveryFee || 0) + (o.driverCommission || 0)).toFixed(0)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[o.status] || "bg-z-page text-z-muted border-z-line"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-z-muted text-xs">
                    {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
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
