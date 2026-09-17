import { NavLink } from "react-router-dom";
import { FiBarChart2, FiShoppingBag, FiTruck, FiUsers, FiHome, FiAlertTriangle, FiDollarSign, FiCreditCard, FiX } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/admin/finance", label: "Finance", icon: FiDollarSign },
  { to: "/admin/payouts", label: "Payouts", icon: FiCreditCard },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/admin/drivers", label: "Drivers", icon: FiTruck },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/restaurants", label: "Restaurants", icon: FiHome },
  { to: "/admin/disputes", label: "Disputes", icon: FiAlertTriangle },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-z-ink/30 md:hidden" onClick={onClose} aria-label="Close menu" />}
      <aside className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-z-surface border-r border-z-line transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold text-z-ink tracking-tight">ZOOMO HQ</span>
          </div>
          <button className="md:hidden text-z-muted" onClick={onClose}><FiX size={18} /></button>
        </div>
        <nav className="px-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-z-sage text-z-primary shadow-glow" : "text-z-sub hover:bg-z-page hover:text-z-ink"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
