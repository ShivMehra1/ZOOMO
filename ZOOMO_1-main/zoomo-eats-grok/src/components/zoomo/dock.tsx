import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Receipt, Search, ShoppingBag, UserRound } from "lucide-react";
import { useZoomo } from "@/lib/zoomo-store";
import { liveStatus } from "@/lib/zoomo-data";

export function MobileDock() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, cart, orders, accountOpen, setAccountOpen } = useZoomo();
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const active = orders.some((o) => {
    const s = liveStatus(o);
    return s !== "DELIVERED" && s !== "CANCELLED";
  });

  const items = [
    { label: "Home", icon: Home, on: pathname === "/", go: () => nav({ to: "/" }) },
    { label: "Search", icon: Search, on: pathname.startsWith("/search") || pathname.startsWith("/restaurants"), go: () => nav({ to: "/search" }) },
    { label: "Bag", icon: ShoppingBag, on: pathname === "/cart" || pathname === "/checkout", go: () => nav({ to: "/cart" }), badge: count },
    {
      label: "Orders",
      icon: Receipt,
      on: pathname.startsWith("/orders"),
      go: () => (user ? nav({ to: "/orders" }) : nav({ to: "/login" })),
      pulse: active,
    },
    {
      label: user ? "You" : "Login",
      icon: UserRound,
      on: Boolean(user) && (accountOpen || pathname === "/profile"),
      go: () => (user ? setAccountOpen(true) : nav({ to: "/login" })),
    },
  ];

  return (
    <nav className="glass-dock fixed inset-x-0 bottom-0 z-40 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={it.go}
            className={`relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold tracking-wide ${
              it.on ? "text-primary" : "text-muted"
            }`}
          >
            <it.icon className="size-5" strokeWidth={it.on ? 2.4 : 1.8} />
            {it.label}
            {"badge" in it && typeof it.badge === "number" && it.badge > 0 && (
              <span className="absolute top-1 right-[18%] flex size-4 items-center justify-center rounded-full bg-accent text-[9px] text-white tabular">
                {it.badge}
              </span>
            )}
            {"pulse" in it && it.pulse && (
              <span className="absolute top-1.5 right-[22%] size-1.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
