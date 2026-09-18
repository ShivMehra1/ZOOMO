import { NavLink } from "react-router-dom";
import { FiBarChart2, FiShoppingBag, FiTruck, FiUsers, FiHome, FiAlertTriangle, FiDollarSign, FiCreditCard, FiX, FiTag } from "react-icons/fi";
import { useAdminInbox } from "../context/AdminInboxContext";

const GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
      { to: "/admin/finance", label: "Finance", icon: FiDollarSign },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/orders", label: "Orders", icon: FiShoppingBag, badge: "unreadOrders" },
      { to: "/admin/payouts", label: "Payouts", icon: FiCreditCard, badge: "unreadPayouts" },
      { to: "/admin/disputes", label: "Disputes", icon: FiAlertTriangle, badge: "disputes" },
      { to: "/admin/offers", label: "Offers", icon: FiTag },
    ],
  },
  {
    label: "Directory",
    items: [
      { to: "/admin/restaurants", label: "Restaurants", icon: FiHome },
      { to: "/admin/drivers", label: "Drivers", icon: FiTruck },
      { to: "/admin/users", label: "People", icon: FiUsers },
    ],
  },
];

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto min-w-[18px] rounded-full bg-z-danger px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Sidebar({ open, onClose }) {
  const inbox = useAdminInbox();
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-z-ink/30 md:hidden" onClick={onClose} aria-label="Close menu" />}
      <aside className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-z-surface border-r border-z-line transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold text-z-ink tracking-tight">ZOOMO ADMIN</span>
          </div>
          <button className="md:hidden text-z-muted" onClick={onClose}><FiX size={18} /></button>
        </div>
        <nav className="px-4 pb-8 space-y-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-z-muted">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, badge }) => (
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
                    <Badge count={badge ? inbox[badge] : 0} />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
