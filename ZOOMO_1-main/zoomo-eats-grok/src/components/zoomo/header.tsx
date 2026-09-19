import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LogIn, MapPin, ShoppingBag, UserPlus } from "lucide-react";
import { ZoomoMark } from "./mark";
import { Avatar } from "./avatar";
import { useZoomo } from "@/lib/zoomo-store";

export function Header({ onLocationClick }: { onLocationClick: () => void }) {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, location, cart, setAccountOpen } = useZoomo();
  const [scrolled, setScrolled] = useState(false);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const isHome = pathname === "/";
  const atTopHome = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] transition-[background,backdrop-filter,box-shadow,border-color] duration-300 ${
      atTopHome ? "border-b border-line bg-surface" : "glass-nav"
    }`}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5">
          <button className="shrink-0" onClick={() => nav({ to: "/" })} aria-label="Zoomo Eats home">
            <span className="flex items-center gap-2.5">
              <ZoomoMark size={34} />
              <span className="text-[15px] font-bold tracking-tight text-ink">Zoomo Eats</span>
            </span>
          </button>
        </div>

        {isHome ? (
          <button
            onClick={onLocationClick}
            className="flex min-w-0 max-w-[240px] flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-left"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
              <MapPin className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold tracking-[0.12em] text-muted uppercase">Delivering to</span>
              <span className={`block truncate text-xs ${location ? "font-bold text-ink" : "text-sub"}`}>
                {location || "Jourian"}
              </span>
            </span>
          </button>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {!isHome && (
            <button
              onClick={onLocationClick}
              className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-sub hover:text-primary"
              aria-label="Change location"
            >
              <MapPin className="size-4" />
            </button>
          )}
          {user ? (
            <button
              onClick={() => setAccountOpen(true)}
              className="flex size-10 items-center overflow-hidden rounded-full border border-line bg-surface sm:h-10 sm:w-auto sm:gap-1.5 sm:pr-3 sm:pl-0.5 sm:text-[13px] sm:font-medium"
              aria-label="Profile"
            >
              <Avatar url={user.avatarUrl} name={user.name} className="size-9 text-xs sm:size-8" />
              <span className="hidden sm:inline text-ink">{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => nav({ to: "/login" })}
                className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink sm:hidden"
                aria-label="Login"
              >
                <LogIn className="size-4" />
              </button>
              <button
                onClick={() => nav({ to: "/login" })}
                className="btn-ghost hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] sm:flex"
              >
                <LogIn className="size-4" /> Login
              </button>
              <button
                onClick={() => nav({ to: "/signup" })}
                className="btn-primary hidden h-10 items-center gap-1.5 rounded-full px-4 text-[13px] sm:flex"
              >
                <UserPlus className="size-4" /> Sign up
              </button>
            </>
          )}
          <button
            onClick={() => nav({ to: "/cart" })}
            className="relative flex size-10 items-center justify-center rounded-full border border-line bg-surface text-sub hover:text-primary"
            aria-label="Cart"
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white tabular">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
