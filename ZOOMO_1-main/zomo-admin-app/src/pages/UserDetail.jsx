import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserById,
  updateUser,
  suspendUser,
  unsuspendUser,
  resetUserPassword,
  getOrders,
} from "../services/adminApi";
import { usersFromOrders, realOrders } from "../lib/real";
import { formatWhen } from "../lib/when";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiEdit2,
  FiCheck,
  FiX,
  FiKey,
  FiSlash,
  FiCheckCircle,
  FiCopy,
} from "react-icons/fi";

const STATUS_COLORS = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
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

export default function UserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [tempPassword, setTempPassword] = useState(null);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  async function load() {
    try {
      setLoading(true);
      try {
        const res = await getUserById(id);
        setUser(res.data);
      } catch {
        const orders = realOrders((await getOrders()).data);
        const u = usersFromOrders(orders).find((x) => x.id === id);
        if (!u) throw new Error("missing");
        setUser({ ...u, orders: orders.filter((o) => o.userId === id), totalSpent: orders.filter((o) => o.userId === id && o.status !== "CANCELLED").reduce((s, o) => s + Number(o.total || 0), 0), addresses: [] });
      }
    } catch {
      alert("Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    setEditing(true);
  }

  async function saveEdit() {
    try {
      setBusy(true);
      await updateUser(id, form);
      setEditing(false);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm("Generate a new temporary password for this user? Their current password stops working immediately.")) return;
    try {
      setBusy(true);
      const res = await resetUserPassword(id);
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
      await suspendUser(id, suspendReason);
      setShowSuspendForm(false);
      setSuspendReason("");
      await load();
    } catch {
      alert("Failed to suspend user");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsuspend() {
    try {
      setBusy(true);
      await unsuspendUser(id);
      await load();
    } catch {
      alert("Failed to unsuspend user");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !user) {
    return <div className="px-6 py-16 text-center text-z-muted">Loading user...</div>;
  }
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav("/admin/users")}
          className="flex size-9 items-center justify-center rounded-full border border-z-line bg-z-surface text-z-sub hover:text-z-primary transition"
          aria-label="Back to users"
        >
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-z-ink">{user.name}</h2>
          <p className="text-z-muted text-sm">{user.email}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-sub border border-z-line">{user.role}</span>
        {user.isSuspended ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">
            Suspended{user.suspendedReason ? `: ${user.suspendedReason}` : ""}
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>
        )}
        {user.mustResetPassword && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Must reset password</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total spent" value={`₹${user.totalSpent.toFixed(0)}`} />
        <StatCard label="Orders" value={user.orders.length} />
        <StatCard label="Addresses" value={user.addresses.length} />
        <StatCard label="Joined" value={formatWhen(user.createdAt)} />
      </div>

      {/* Details / edit */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-z-ink font-semibold">Details</h3>
          {!editing ? (
            <button onClick={startEdit} className="flex items-center gap-1.5 text-xs font-semibold text-z-primary">
              <FiEdit2 size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={saveEdit} disabled={busy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-z-primary text-white text-xs font-semibold disabled:opacity-50">
                <FiCheck size={13} /> Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-z-page text-z-sub text-xs font-semibold">
                <FiX size={13} /> Cancel
              </button>
            </div>
          )}
        </div>
        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-z-muted text-xs">Name</p><p className="text-z-ink mt-0.5">{user.name}</p></div>
            <div><p className="text-z-muted text-xs">Email</p><p className="text-z-ink mt-0.5">{user.email}</p></div>
            <div><p className="text-z-muted text-xs">Phone</p><p className="text-z-ink mt-0.5">{user.phone || "—"}</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {["name", "email", "phone"].map((k) => (
              <label key={k}>
                <span className="block text-z-muted text-xs mb-1 capitalize">{k}</span>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-xl border border-z-line bg-z-page px-3 py-2 text-sm text-z-ink"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {tempPassword && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-amber-800 text-sm font-medium">New temporary password (shown once — relay it to the user now):</p>
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
            <button onClick={handleSuspend} disabled={busy} className="px-4 py-2 rounded-lg bg-z-danger text-white text-sm font-medium disabled:opacity-50">Confirm suspend</button>
            <button onClick={() => setShowSuspendForm(false)} className="px-4 py-2 rounded-lg text-z-sub text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={handleResetPassword} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-primary hover:bg-z-hover text-white text-sm font-medium transition disabled:opacity-50">
          <FiKey size={14} /> Reset password
        </button>
        {user.isSuspended ? (
          <button onClick={handleUnsuspend} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium transition disabled:opacity-50">
            <FiCheckCircle size={14} /> Unsuspend
          </button>
        ) : (
          <button onClick={() => setShowSuspendForm(true)} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-z-danger border border-red-200 text-sm font-medium transition disabled:opacity-50">
            <FiSlash size={14} /> Suspend
          </button>
        )}
      </div>

      {/* Addresses */}
      {user.addresses.length > 0 && (
        <div className="rounded-card border border-z-line bg-z-surface shadow-card p-5">
          <h3 className="text-z-ink font-semibold mb-3">Addresses</h3>
          <div className="space-y-2">
            {user.addresses.map((a) => (
              <div key={a.id} className="text-sm text-z-sub bg-z-page rounded-xl px-3 py-2">
                {a.street}, {a.city}, {a.state} {a.zipCode}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full order history */}
      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-z-line">
          <h3 className="text-z-ink font-semibold">Order history ({user.orders.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-3 text-z-muted font-medium">Order ID</th>
                <th className="px-6 py-3 text-z-muted font-medium">Restaurant</th>
                <th className="px-6 py-3 text-z-muted font-medium">Total</th>
                <th className="px-6 py-3 text-z-muted font-medium">Status</th>
                <th className="px-6 py-3 text-z-muted font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {user.orders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-z-muted">No orders yet</td></tr>
              )}
              {user.orders.map((o) => {
                const open = expandedOrder === o.id;
                return (
                  <>
                    <tr
                      key={o.id}
                      onClick={() => setExpandedOrder(open ? null : o.id)}
                      className="cursor-pointer border-t border-z-line-soft hover:bg-z-page transition"
                    >
                      <td className="px-6 py-3 text-z-sub font-mono text-xs">#{o.id.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-z-ink">{o.restaurant?.name || "—"}</td>
                      <td className="px-6 py-3 text-z-ink font-medium tabular-nums">₹{o.total.toFixed(0)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[o.status] || "bg-z-page text-z-muted border-z-line"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-z-muted text-xs">
                        {formatWhen(o.createdAt)}
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${o.id}-detail`} className="border-t border-z-line-soft bg-z-page">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-z-muted mb-3">
                            <span>Type: <b className="text-z-ink">{o.orderType}</b></span>
                            <span>Food: <b className="text-z-ink">₹{o.subtotal.toFixed(0)}</b></span>
                            <span>Delivery fee: <b className="text-z-ink">₹{(o.deliveryFee || 0).toFixed(0)}</b></span>
                            <span>Tax: <b className="text-z-ink">₹{(o.tax || 0).toFixed(0)}</b></span>
                            <span>Tip: <b className="text-z-ink">₹{(o.tip || 0).toFixed(0)}</b></span>
                            {o.driver?.user?.name && <span>Driver: <b className="text-z-ink">{o.driver.user.name}</b></span>}
                          </div>
                          <div className="space-y-1">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-z-ink">{it.quantity}× {it.dish?.name}</span>
                                <span className="text-z-sub tabular-nums">₹{(it.price * it.quantity).toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
