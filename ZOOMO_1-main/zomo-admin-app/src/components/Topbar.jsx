import { useEffect, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import SearchPalette from "./SearchPalette";
import { formatClock } from "../lib/when";
import { FiMenu, FiLogOut, FiSearch } from "react-icons/fi";

export default function Topbar({ onMenu }) {
  const { logout } = useAdminAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [clock, setClock] = useState(formatClock());
  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 30000);
    return () => clearInterval(t);
  }, []);
  const local = Boolean(import.meta.env.DEV);
  return (
    <header className="h-16 bg-z-surface border-b border-z-line flex items-center justify-between px-4 sm:px-6">
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="flex items-center gap-3">
        <button type="button" className="md:hidden p-2 rounded-xl border border-z-line text-z-ink" onClick={onMenu}>
          <FiMenu size={16} />
        </button>
        <h1 className="text-z-ink font-semibold text-base">Admin</h1>
        <p className="hidden sm:block text-z-muted text-xs tabular-nums">{clock} IST</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSearchOpen(true)} className="hidden sm:flex items-center gap-2 rounded-xl border border-z-line px-3 py-1.5 text-xs text-z-muted hover:text-z-ink">
          <FiSearch size={14} /> Search
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${local ? "bg-amber-50 border-amber-200" : "bg-z-sage border-z-accent/20"}`}>
          <span className={`w-2 h-2 rounded-full ${local ? "bg-amber-500" : "bg-z-primary animate-pulse"}`}></span>
          <span className={`text-xs font-medium ${local ? "text-amber-800" : "text-z-primary"}`}>{local ? "Local" : "Live"}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-page border border-z-line text-z-sub hover:text-z-ink hover:bg-z-sage transition text-sm"
        >
          <FiLogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
