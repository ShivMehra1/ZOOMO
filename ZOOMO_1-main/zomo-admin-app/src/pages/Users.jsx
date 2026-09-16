import { useEffect, useState } from "react";
import {
  getUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  resetUserPassword,
} from "../services/adminApi";
import { FiSearch, FiRefreshCw, FiKey, FiSlash, FiCheckCircle, FiX, FiCopy } from "react-icons/fi";

const ROLE_FILTERS = ["ALL", "USER", "MERCHANT", "DRIVER"];

function UserDetailModal({ userId, onClose, onChanged }) {
  const [user, setUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [busy, setBusy] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  useEffect(() => {
    getUserById(userId).then((res) => setUser(res.data)).catch(() => alert("Failed to load user"));
  }, [userId]);

  async function handleResetPassword() {
    if (!confirm("Generate a new temporary password for this user? Their current password stops working immediately.")) return;
    try {
      setBusy(true);
      const res = await resetUserPassword(userId);
      setTempPassword(res.data.tempPassword);
      onChanged?.();
    } catch {
      alert("Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  async function handleSuspend() {
    try {
      setBusy(true);
      await suspendUser(userId, suspendReason);
      const res = await getUserById(userId);
      setUser(res.data);
      setShowSuspendForm(false);
      setSuspendReason("");
      onChanged?.();
    } catch {
      alert("Failed to suspend user");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsuspend() {
    try {
      setBusy(true);
      await unsuspendUser(userId);
      const res = await getUserById(userId);
      setUser(res.data);
      onChanged?.();
    } catch {
      alert("Failed to unsuspend user");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-z-surface w-full max-w-xl rounded-card p-6 space-y-5 shadow-card max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!user ? (
          <p className="text-z-muted text-sm">Loading...</p>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-z-ink">{user.name}</h3>
                <p className="text-z-muted text-sm">{user.email}</p>
                {user.phone && <p className="text-z-muted text-sm">{user.phone}</p>}
              </div>
              <button onClick={onClose} className="text-z-muted hover:text-z-ink">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-sage text-z-primary border border-z-accent/20">
                {user.role}
              </span>
              {user.isSuspended ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">
                  Suspended{user.suspendedReason ? `: ${user.suspendedReason}` : ""}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  Active
                </span>
              )}
              {user.mustResetPassword && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Must reset password
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-z-page rounded-xl p-3">
                <p className="text-z-muted text-xs">Total spent</p>
                <p className="text-z-ink font-semibold">₹{user.totalSpent.toFixed(0)}</p>
              </div>
              <div className="bg-z-page rounded-xl p-3">
                <p className="text-z-muted text-xs">Joined</p>
                <p className="text-z-ink font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {tempPassword && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-amber-800 text-sm font-medium">
                  New temporary password (shown once — relay it to the user now):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono text-z-ink">
                    {tempPassword}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(tempPassword)}
                    className="p-2 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-100"
                    title="Copy"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-z-ink text-sm font-semibold">Recent Orders</h4>
              {user.orders?.length === 0 && <p className="text-z-muted text-sm">No orders yet</p>}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {user.orders?.map((o) => (
                  <div key={o.id} className="flex items-center justify-between bg-z-page rounded-lg px-3 py-2 text-sm">
                    <div>
                      <p className="text-z-ink">{o.restaurant?.name}</p>
                      <p className="text-z-muted text-xs">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-z-ink font-medium">₹{o.total.toFixed(0)}</p>
                      <p className="text-z-muted text-xs">{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showSuspendForm && (
              <div className="space-y-2 bg-z-page rounded-xl p-3">
                <input
                  type="text"
                  placeholder="Reason for suspension"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-z-line bg-z-surface text-sm text-z-ink"
                />
                <div className="flex gap-2">
                  <button onClick={handleSuspend} disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-z-danger text-white text-sm font-medium">
                    Confirm suspend
                  </button>
                  <button onClick={() => setShowSuspendForm(false)} className="px-3 py-2 rounded-lg text-z-sub text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-z-line-soft">
              <button
                onClick={handleResetPassword}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-primary hover:bg-z-hover text-white text-sm font-medium transition disabled:opacity-50"
              >
                <FiKey size={14} /> Reset Password
              </button>
              {user.isSuspended ? (
                <button
                  onClick={handleUnsuspend}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-medium transition disabled:opacity-50"
                >
                  <FiCheckCircle size={14} /> Unsuspend
                </button>
              ) : (
                <button
                  onClick={() => setShowSuspendForm(true)}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-z-danger border border-red-200 text-sm font-medium transition disabled:opacity-50"
                >
                  <FiSlash size={14} /> Suspend
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await getUsers(search || undefined, roleFilter === "ALL" ? undefined : roleFilter);
      setUsers(res.data);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Users</h2>
          <p className="text-z-muted text-sm mt-1">{users.length} accounts</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={15} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-z-line bg-z-surface text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
          />
        </div>
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                roleFilter === r ? "bg-z-primary text-white" : "bg-z-surface border border-z-line text-z-sub hover:border-z-primary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-z-line bg-z-surface shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-z-line bg-z-page">
                <th className="px-6 py-4 text-z-muted font-medium">Name</th>
                <th className="px-6 py-4 text-z-muted font-medium">Email</th>
                <th className="px-6 py-4 text-z-muted font-medium">Role</th>
                <th className="px-6 py-4 text-z-muted font-medium">Orders</th>
                <th className="px-6 py-4 text-z-muted font-medium">Status</th>
                <th className="px-6 py-4 text-z-muted font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-z-muted">Loading users...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-z-muted">No users found</td></tr>
              )}
              {!loading && users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className="border-t border-z-line-soft hover:bg-z-page transition cursor-pointer"
                >
                  <td className="px-6 py-4 text-z-ink font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-z-sub">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-sub border border-z-line">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-z-sub">{u.orderCount}</td>
                  <td className="px-6 py-4">
                    {u.isSuspended ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-z-muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onChanged={fetchUsers}
        />
      )}
    </div>
  );
}
