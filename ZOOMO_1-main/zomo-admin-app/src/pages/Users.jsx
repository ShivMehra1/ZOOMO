import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, deleteUser, getUsers, purgeSeed } from "../services/adminApi";
import { useConfirm } from "../context/ConfirmContext";
import CreateSheet from "../components/CreateSheet";
import { formatWhen } from "../lib/when";
import { FiSearch, FiRefreshCw, FiChevronRight, FiTrash2, FiPlus } from "react-icons/fi";

const ROLE_FILTERS = ["ALL", "USER", "MERCHANT", "DRIVER", "ADMIN"];

export default function Users() {
  const nav = useNavigate();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [creating, setCreating] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await getUsers(search || undefined, roleFilter === "ALL" ? undefined : roleFilter);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchUsers, 200);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [users, search, roleFilter]);

  async function purge() {
    const ok = await confirm({
      title: "Remove leftover seed accounts?",
      body: "This hard-deletes junk demo rows. Live Jourian restaurants, the admin, driver, and customer logins are kept.",
      confirmLabel: "Purge seed",
    });
    if (!ok) return;
    await purgeSeed();
    fetchUsers();
  }

  async function removeOne(e, u) {
    e.stopPropagation();
    const merchantWarn = u.role === "MERCHANT"
      ? " Deleting this account deletes the whole restaurant, its menu, and its orders."
      : "";
    const ok = await confirm({
      title: `Delete ${u.name}?`,
      body: `This permanently removes the account.${merchantWarn}`,
      confirmLabel: "Delete account",
    });
    if (!ok) return;
    await deleteUser(u.id);
    setUsers((cur) => cur.filter((x) => x.id !== u.id));
  }

  return (
    <div className="space-y-6">
      {creating && (
        <CreateSheet
          kind="user"
          title="Create person"
          onClose={() => setCreating(false)}
          onSubmit={async (data) => { await createUser(data); fetchUsers(); }}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">People</h2>
          <p className="text-z-muted text-sm mt-1">{visible.length} accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={purge} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-danger/10 border border-z-danger/20 text-z-danger text-sm font-semibold">
            <FiTrash2 size={14} /> Purge seed
          </button>
          <button onClick={() => setCreating(true)} className="btn-primary"><FiPlus size={14} /> Create</button>
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
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
        <div className="flex gap-1.5 overflow-x-auto">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                roleFilter === r ? "bg-z-sage text-z-primary shadow-glow" : "bg-z-surface border border-z-line text-z-sub hover:border-z-primary"
              }`}
            >
              {r === "USER" ? "CUSTOMER" : r}
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
                <th className="px-6 py-4 text-z-muted font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-z-muted">Loading people...</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-z-muted">No accounts yet</td></tr>
              )}
              {!loading && visible.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => nav(`/admin/users/${u.id}`)}
                  className="border-t border-z-line-soft hover:bg-z-page transition cursor-pointer"
                >
                  <td className="px-6 py-4 text-z-ink font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-z-sub">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-z-page text-z-sub border border-z-line">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-z-sub">{u.orderCount ?? 0}</td>
                  <td className="px-6 py-4">
                    {u.isSuspended ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-z-danger border border-red-200">Suspended</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-z-muted text-xs">{formatWhen(u.createdAt)}</td>
                  <td className="px-6 py-4 text-z-muted">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => removeOne(e, u)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-z-danger" title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                      <FiChevronRight size={16} />
                    </div>
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
