import {
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ZoomoMark } from "./mark";
import { useZoomo } from "@/lib/zoomo-store";

export function AccountSheet() {
  const nav = useNavigate();
  const { user, orders, addresses, favorites, cart, logout, accountOpen, setAccountOpen } = useZoomo();
  if (!accountOpen || !user) return null;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  function go(fn: () => void) {
    setAccountOpen(false);
    fn();
  }

  const rows = [
    { icon: Package, label: "My orders", hint: orders.length ? `${orders.length} placed` : "None yet", run: () => nav({ to: "/orders" }) },
    { icon: MapPin, label: "My addresses", hint: addresses.length ? `${addresses.length} saved` : "Add one", run: () => nav({ to: "/profile", hash: "addresses" }) },
    { icon: Heart, label: "Saved restaurants", hint: favorites.length ? `${favorites.length}` : "None yet", run: () => nav({ to: "/profile", hash: "saved" }) },
    { icon: Tag, label: "Offers", hint: "Activate this week’s deals", run: () => nav({ to: "/", hash: "offers" }) },
    { icon: ShoppingBag, label: "My bag", hint: cartCount ? `${cartCount} item${cartCount === 1 ? "" : "s"}` : "Empty", run: () => nav({ to: "/cart" }) },
    { icon: UserRound, label: "Account settings", hint: "Phone, veg mode, payment", run: () => nav({ to: "/profile" }) },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-end bg-ink/40 p-3 backdrop-blur-md sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAccountOpen(false);
      }}
    >
      <div className="mt-12 max-h-[min(640px,calc(100vh-5rem))] w-[min(100%,24rem)] overflow-y-auto rounded-[28px] bg-surface shadow-lift sm:mt-0">
        <div className="bg-primary px-5 pt-5 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ZoomoMark size={48} onGreen />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold tracking-tight text-white">{user.name}</p>
                <p className="mt-0.5 truncate text-xs text-white/60">{user.email}</p>
              </div>
            </div>
            <button onClick={() => setAccountOpen(false)} className="rounded-lg p-1 text-white/70 hover:text-white" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <button
            onClick={() => go(() => nav({ to: "/profile" }))}
            className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-primary"
          >
            Edit profile
          </button>
        </div>
        <nav className="p-2">
          {rows.map((row) => (
            <button
              key={row.label}
              onClick={() => go(row.run)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-page"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage text-primary">
                <row.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{row.label}</span>
                <span className="block text-xs text-muted">{row.hint}</span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          ))}
        </nav>
        <div className="p-3 pt-0">
          <button
            onClick={() => {
              logout();
              setAccountOpen(false);
              nav({ to: "/" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger/10 py-3 text-sm font-bold text-danger"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
