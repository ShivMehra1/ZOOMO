import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { getRestaurants, getUsers, getOrders } from "../services/adminApi";

export default function SearchPalette({ open, onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState({ restaurants: [], people: [], orders: [] });

  useEffect(() => {
    if (!open) return;
    Promise.all([getRestaurants().catch(() => ({ data: [] })), getUsers().catch(() => ({ data: [] })), getOrders().catch(() => ({ data: [] }))])
      .then(([r, u, o]) => setRows({ restaurants: r.data || [], people: u.data || [], orders: o.data || [] }));
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out = [];
    for (const r of rows.restaurants) {
      if (String(r.name).toLowerCase().includes(needle)) out.push({ type: "Restaurant", label: r.name, to: `/admin/restaurants/${r.id}` });
    }
    for (const u of rows.people) {
      if ([u.name, u.email].some((v) => String(v || "").toLowerCase().includes(needle))) {
        out.push({ type: u.role === "DRIVER" ? "Driver" : "Person", label: u.name, to: `/admin/users/${u.id}` });
      }
    }
    for (const o of rows.orders) {
      if (String(o.id).toLowerCase().includes(needle) || String(o.user?.name || "").toLowerCase().includes(needle)) {
        out.push({ type: "Order", label: `#${o.id.slice(0, 8)} · ${o.restaurant?.name || ""}`, to: "/admin/orders" });
      }
    }
    return out.slice(0, 12);
  }, [q, rows]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center bg-z-ink/40 p-4 pt-24" onClick={onClose}>
      <div className="w-full max-w-xl rounded-card bg-z-surface shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-z-line px-4 py-3">
          <FiSearch className="text-z-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search restaurants, people, orders…" className="flex-1 bg-transparent text-sm outline-none" />
          <button type="button" onClick={onClose}><FiX className="text-z-muted" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-z-muted">Type to search Jourian.</p>}
          {results.map((r) => (
            <button
              key={r.to + r.label}
              type="button"
              onClick={() => { nav(r.to); onClose(); }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-z-page"
            >
              <span className="text-sm font-medium text-z-ink">{r.label}</span>
              <span className="text-[11px] text-z-muted">{r.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
