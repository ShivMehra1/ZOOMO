import { useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiShoppingBag,
  FiMenu,
  FiBarChart2,
  FiTag,
  FiStar,
  FiHome,
} from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: FiGrid },
  { to: "/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/menu", label: "Menu", icon: FiMenu },
  { to: "/analytics", label: "Insights", icon: FiBarChart2 },
  { to: "/promotions", label: "Promos", icon: FiTag },
  { to: "/reviews", label: "Reviews", icon: FiStar },
  { to: "/restaurant", label: "Store", icon: FiHome },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-z-surface/90
        backdrop-blur
        border-t border-z-line
        flex
        overflow-x-auto no-scrollbar
      "
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`
              flex flex-col items-center justify-center gap-1
              flex-1 min-w-[64px] py-2
              transition
              ${active ? "text-z-primary" : "text-z-muted"}
            `}
          >
            <Icon size={18} />
            <span className={`text-[11px] ${active ? "font-semibold" : ""}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
