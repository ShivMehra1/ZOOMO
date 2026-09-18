import { useState, useEffect } from "react";
import PortalCard from "../components/PortalCard";

const PORTALS = [
  {
    icon: "🍔",
    title: "Customer App",
    description:
      "Browse Jourian's restaurants, build your bag, and watch it move to your door in real time.",
    buttonText: "Start ordering",
    href: import.meta.env.VITE_CUSTOMER_URL || "http://localhost:5173",
    badge: "For customers",
  },
  {
    icon: "🏪",
    title: "Merchant",
    description:
      "Accept tickets, keep the menu current, and see every order the moment it lands.",
    buttonText: "Manage restaurant",
    href: import.meta.env.VITE_MERCHANT_URL || "http://localhost:5175",
    badge: "For merchants",
  },
  {
    icon: "🚴",
    title: "Driver",
    description:
      "Go online, accept rides, navigate the drop, and watch your earnings add up.",
    buttonText: "Start delivering",
    href: import.meta.env.VITE_DRIVER_URL || "http://localhost:5174",
    badge: "For drivers",
  },
  {
    icon: "🛡️",
    title: "Admin",
    description:
      "Every user, restaurant, driver, and order — the whole town from one screen.",
    buttonText: "Open admin panel",
    href: import.meta.env.VITE_ADMIN_URL || "http://localhost:5176",
    badge: "Admin only",
  },
];

const API_URL = import.meta.env.DEV ? "/backend" : (import.meta.env.VITE_API_URL || "http://localhost:3000");

export default function Landing() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ restaurants: null, dishes: null, live: null });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/restaurants`)
      .then((res) => res.json())
      .then((restaurants) => {
        const dishCount = restaurants.reduce((sum, r) => sum + (r.dishes?.length || 0), 0);
        setStats({ restaurants: restaurants.length, dishes: dishCount, live: true });
      })
      .catch(() => setStats({ restaurants: null, dishes: null, live: false }));
  }, []);

  const STATS = [
    { label: "Restaurants", value: stats.restaurants ?? "—" },
    { label: "Menu items", value: stats.dishes ?? "—" },
    { label: "Apps", value: "4" },
    { label: "Status", value: stats.live === false ? "Offline" : "Live" },
  ];

  return (
    <div className="min-h-screen bg-z-page text-z-ink">
      {/* ======= NAVBAR ======= */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-z-surface/90 backdrop-blur-md border-b border-z-line">
        <div className="flex items-center gap-3">
          <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-9 h-9 rounded-[22%] object-contain" />
          <span className="text-xl font-bold tracking-tight text-z-ink">Zoomo Eats</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-z-primary bg-z-sage px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-z-accent animate-pulse"></span>
          Every app is up •{" "}
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </nav>

      {/* ======= HERO ======= */}
      <section className="pt-20 pb-16 px-6 text-center animate-fade-in">
        <p className="kicker mb-3">Zoomo Workspace</p>

        <h1 className="display text-5xl md:text-7xl max-w-3xl mx-auto mb-6 text-z-ink">
          Same login.
          <br />
          <span className="text-z-accent">Four different jobs.</span>
        </h1>

        <p className="text-z-sub text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Whether you're ordering, cooking, riding, or running the numbers —
          sign in and get straight to work.
        </p>
        <p className="mt-3 text-sm font-medium text-z-muted">Zoom it. Eat it. Love it.</p>
      </section>

      {/* ======= STATS ======= */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-2xl bg-z-sage">
              <div className="text-2xl font-bold text-z-primary">{stat.value}</div>
              <div className="text-xs text-z-primary/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ======= PORTAL CARDS ======= */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PORTALS.map((portal) => (
            <PortalCard key={portal.title} {...portal} />
          ))}
        </div>
      </section>

      {/* ======= FOOTER (brand green band) ======= */}
      <footer className="bg-z-primary text-white px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-7 h-7 rounded-[22%] object-contain bg-white" />
            <span className="text-sm text-white/60">Zoomo Eats — local build</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/50">
            <a href={import.meta.env.VITE_CUSTOMER_URL || "http://localhost:5173"} className="hover:text-white transition">Order</a>
            <a href={import.meta.env.VITE_DRIVER_URL || "http://localhost:5174"} className="hover:text-white transition">Ride</a>
            <a href={import.meta.env.VITE_MERCHANT_URL || "http://localhost:5175"} className="hover:text-white transition">Kitchen</a>
            <a href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5176"} className="hover:text-white transition">HQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
