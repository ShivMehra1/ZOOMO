import { FiLogOut } from "react-icons/fi";
import { useDriverAuth } from "../context/DriverAuthContext";

export default function Header({ title = "Rider" }) {
  const { driver, logout } = useDriverAuth();

  return (
    <header
      className="sticky top-0 z-30 border-b
                 border-z-line
                 bg-z-surface
                 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
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
            <span className="kicker block leading-tight">{title}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs font-bold text-z-sub">
            {driver?.name ?? "Driver"}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full border border-z-line
                       px-3 py-1.5 text-xs font-bold text-z-danger"
          >
            <FiLogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
