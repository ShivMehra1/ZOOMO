import { useState, useEffect } from "react";
import PortalCard from "../components/PortalCard";
import {
  FiShoppingBag,
  FiGrid,
  FiTruck,
  FiShield,
  FiMoon,
  FiSun,
} from "react-icons/fi";

const PORTALS = [
  {
    icon: "🍔",
    title: "Customer App",
    description:
      "Order food from your favourite restaurants. Track your delivery in real-time and enjoy hot meals at your doorstep.",
    buttonText: "Order Now",
    href: "https://zoomo-self.vercel.app/",
    gradient: "bg-gradient-to-br from-orange-500/30 to-red-500/30",
    badge: "For Customers",
  },
  {
    icon: "🏪",
    title: "Merchant Portal",
    description:
      "Manage your restaurant, menu, and incoming orders. View analytics and keep your kitchen running smoothly.",
    buttonText: "Manage Restaurant",
    href: "https://zoomo-hc64.vercel.app",
    gradient: "bg-gradient-to-br from-emerald-500/30 to-teal-500/30",
    badge: "For Merchants",
  },
  {
    icon: "🚴",
    title: "Driver App",
    description:
      "Accept delivery requests, navigate to restaurants and customers, and track your daily earnings all in one place.",
    buttonText: "Start Delivering",
    href: "https://zoomo-7jgt.vercel.app/",
    gradient: "bg-gradient-to-br from-blue-500/30 to-indigo-500/30",
    badge: "For Drivers",
  },
  {
    icon: "🛡️",
    title: "Admin Panel",
    description:
      "Full control over the platform. Manage users, restaurants, drivers, and orders from one powerful dashboard.",
    buttonText: "Open Admin Panel",
    href: "https://zoomo-bfu3.vercel.app/",
    gradient: "bg-gradient-to-br from-purple-500/30 to-pink-500/30",
    badge: "Admin Only",
  },
];

const STATS = [
  { label: "Restaurants", value: "3+" },
  { label: "Menu Items", value: "20+" },
  { label: "Portals", value: "4" },
  { label: "Status", value: "Live" },
];

export default function Landing() {
  const [dark, setDark] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-[#0a0a0a] text-white transition-colors">

      {/* ======= NAVBAR ======= */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/brand/mark-on-green.png" alt="Zoomo" className="w-9 h-9 rounded-[22%] object-contain" />
          <span className="text-xl font-bold tracking-tight">Zoomo</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          All systems live •{" "}
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          {dark ? (
            <FiSun className="text-yellow-400" />
          ) : (
            <FiMoon className="text-gray-300" />
          )}
        </button>
      </nav>

      {/* ======= HERO ======= */}
      <section className="pt-40 pb-20 px-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Zoomo Platform — All Apps
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          One Platform.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            Every Role.
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Zoomo connects customers, merchants, drivers, and admins in one
          seamless food delivery ecosystem. Choose your portal below.
        </p>
      </section>

      {/* ======= STATS ======= */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
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

      {/* ======= FOOTER ======= */}
      <footer className="border-t border-white/10 px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/brand/mark-on-green.png" alt="Zoomo" className="w-7 h-7 rounded-[22%] object-contain" />
            <span className="text-sm text-gray-400">
              Zoomo Eats — Dev Environment
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a
              href="http://localhost:5173"
              className="hover:text-emerald-400 transition"
            >
              Customer :5173
            </a>
            <a
              href="http://localhost:5174"
              className="hover:text-emerald-400 transition"
            >
              Driver :5174
            </a>
            <a
              href="http://localhost:5175"
              className="hover:text-emerald-400 transition"
            >
              Merchant :5175
            </a>
            <a
              href="http://localhost:5176"
              className="hover:text-emerald-400 transition"
            >
              Admin :5176
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
