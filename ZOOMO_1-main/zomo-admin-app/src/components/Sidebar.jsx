import { NavLink } from "react-router-dom";
import { FiBarChart2, FiShoppingBag, FiTruck, FiUsers, FiHome, FiAlertTriangle } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/admin/drivers", label: "Drivers", icon: FiTruck },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/restaurants", label: "Restaurants", icon: FiHome },
  { to: "/admin/disputes", label: "Disputes", icon: FiAlertTriangle },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-z-surface border-r border-z-line">
      <div className="p-6 flex items-center gap-2.5">
        <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-7 h-7 object-contain" />
        <span className="text-lg font-bold text-z-ink tracking-tight">ZOOMO ADMIN</span>
      </div>

      <nav className="px-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <SidebarItem key={to} to={to} label={label} Icon={Icon} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
        ${
          isActive
            ? "bg-z-primary text-white"
            : "text-z-sub hover:bg-z-page hover:text-z-ink"
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}
