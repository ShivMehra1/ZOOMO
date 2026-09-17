import { useAdminAuth } from "../context/AdminAuthContext";
import { FiMenu, FiLogOut } from "react-icons/fi";

export default function Topbar({ onMenu }) {
  const { logout } = useAdminAuth();
  return (
    <header className="h-16 bg-z-surface border-b border-z-line flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" className="md:hidden p-2 rounded-xl border border-z-line text-z-ink" onClick={onMenu}>
          <FiMenu size={16} />
        </button>
        <h1 className="text-z-ink font-semibold text-base">Dashboard</h1>
        <p className="text-z-muted text-xs">Welcome back, Admin</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-z-sage border border-z-accent/20">
          <span className="w-2 h-2 rounded-full bg-z-primary animate-pulse"></span>
          <span className="text-z-primary text-xs font-medium">Live</span>
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
