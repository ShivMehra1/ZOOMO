import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  FiBarChart2,
  FiUser,
} from "react-icons/fi";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname.startsWith(path);

  const navItem = (path, label, Icon) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => navigate(path)}
        className={`
          flex flex-col items-center justify-center gap-1
          flex-1 py-2
          transition
          ${
            active
              ? "text-z-primary"
              : "text-z-muted"
          }
        `}
      >
        <Icon size={20} />
        <span
          className={`text-xs ${
            active ? "font-semibold" : ""
          }`}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-z-surface/90
        backdrop-blur
        border-t border-z-line
        flex
      "
    >
      {navItem("/home", "Home", FiHome)}
      {navItem("/orders", "Orders", FiPackage)}
      {navItem("/dashboard", "Dashboard", FiBarChart2)}
      {navItem("/profile", "Profile", FiUser)}
    </div>
  );
}
