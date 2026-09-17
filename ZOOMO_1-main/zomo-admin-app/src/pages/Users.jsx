import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/adminApi";
import { FiSearch, FiRefreshCw, FiChevronRight } from "react-icons/fi";

const ROLE_FILTERS = ["ALL", "USER", "MERCHANT", "DRIVER"];

export default function Users() {
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                roleFilter === r ? "bg-z-sage text-z-primary shadow-glow" : "bg-z-surface border border-z-line text-z-sub hover:border-z-primary"
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
                <th className="px-6 py-4 text-z-muted font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-z-muted">Loading users...</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-z-muted">No users found</td></tr>
              )}
              {!loading && users.map((u) => (
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
                  <td className="px-6 py-4 text-z-muted">
                    <FiChevronRight size={16} />
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
