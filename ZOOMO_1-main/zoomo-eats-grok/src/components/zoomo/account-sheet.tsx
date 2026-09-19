import { ChevronRight, Heart, LogOut, MapPin, Package, ShoppingBag, Tag, UserRound, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useZoomo } from "@/lib/zoomo-store";
import { Avatar } from "./avatar";

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
    { icon: Package, label: "My orders", hint: orders.length ? `${orders.length}` : "None yet", run: () => nav({ to: "/orders" }) },
    { icon: MapPin, label: "Addresses", hint: addresses.length ? `${addresses.length} saved` : "Add one", run: () => nav({ to: "/profile", hash: "addresses" }) },
    { icon: Heart, label: "Saved restaurants", hint: favorites.length ? `${favorites.length}` : "None yet", run: () => nav({ to: "/profile", hash: "saved" }) },
    { icon: Tag, label: "Offers", hint: "This week’s deals", run: () => nav({ to: "/", hash: "offers" }) },
    { icon: ShoppingBag, label: "Bag", hint: cartCount ? `${cartCount} item${cartCount === 1 ? "" : "s"}` : "Empty", run: () => nav({ to: "/cart" }) },
    { icon: UserRound, label: "Account", hint: "Photo, phone, veg mode", run: () => nav({ to: "/profile" }) },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-end bg-ink/20 p-3 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem))] sm:p-6 sm:pt-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAccountOpen(false);
      }}
    >
      <div className="max-h-[min(680px,calc(100vh-6rem))] w-[min(100%,24rem)] overflow-y-auto rounded-[28px] bg-white shadow-lift">
        <div className="relative px-5 pt-5 pb-4">
          <button
            onClick={() => setAccountOpen(false)}
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <div className="flex flex-col items-center text-center">
            <Avatar url={user.avatarUrl} name={user.name} className="size-20 text-2xl ring-4 ring-sage shadow-card" />
            <p className="mt-3 text-[11px] font-bold tracking-[0.14em] text-accent uppercase">Zoomo Eats</p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-ink">{user.name}</h2>
            <p className="mt-0.5 text-[12px] text-muted">{user.email}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-line-soft">
            {[
              [String(orders.length), "Orders"],
              [String(favorites.length), "Saved"],
              [String(addresses.length), "Addresses"],
            ].map(([n, l]) => (
              <div key={l} className="px-1 text-center">
                <p className="text-[16px] font-bold tabular text-primary">{n}</p>
                <p className="text-[11px] text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-3 mb-3 divide-y divide-line-soft overflow-hidden rounded-[20px] bg-white shadow-card">
          {rows.map((row) => (
            <button key={row.label} onClick={() => go(row.run)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
                <row.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{row.label}</span>
                <span className="block text-[12px] text-accent">{row.hint}</span>
              </span>
              <ChevronRight className="size-4 text-primary/40" />
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            logout();
            setAccountOpen(false);
            nav({ to: "/" });
          }}
          className="flex w-full items-center justify-center gap-2 py-4 text-[15px] font-semibold text-danger"
        >
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </div>
  );
}
