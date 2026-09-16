import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLogOut } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/menu", label: "Menu" },
  { to: "/analytics", label: "Analytics" },
  { to: "/promotions", label: "Promotions" },
  { to: "/reviews", label: "Reviews" },
  { to: "/restaurant", label: "Restaurant" },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-z-page">
      <header className="sticky top-0 z-30 border-b border-z-line bg-z-surface">
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand/mark-on-white.png"
                alt="Zoomo"
                className="w-8 h-8 rounded-[22%] object-contain"
              />
              <span>
                <span className="block text-[15px] font-bold text-z-ink leading-tight">
                  Zoomo Eats
                </span>
                <span className="kicker block leading-tight">Merchant</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs font-bold text-z-sub">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-full border border-z-line px-3 py-1.5 text-xs font-bold text-z-sub hover:border-z-primary hover:text-z-primary transition"
              >
                <FiLogOut size={13} />
                Sign out
              </button>
            </div>
          </div>

          <nav className="mt-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `chip ${isActive ? "chip-on" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">{children}</main>
    </div>
  );
}
