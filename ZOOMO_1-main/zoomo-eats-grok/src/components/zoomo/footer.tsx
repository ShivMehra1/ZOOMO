import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import { AREAS, PUNCHLINE, TOWN } from "@/lib/zoomo-data";
import { ZoomoMark } from "./mark";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-primary px-5 pt-16 pb-28 text-white md:pb-12">

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-6 rounded-[28px] bg-white/8 px-6 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">{PUNCHLINE}</p>
            <h2 className="display mt-1 text-[28px]">Hot bags in {TOWN}.</h2>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-primary"
          >
            Order now <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <ZoomoMark size={36} onGreen />
              <span className="text-[17px] font-bold tracking-tight">Zoomo Eats</span>
            </div>
            <p className="max-w-[240px] text-sm leading-6 text-white/55">
              One tehsil. Restaurants in Jourian. We don’t leave town, so the bag is still hot.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">Company</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/restaurants" className="hover:text-white">Restaurants</Link></li>
              <li><Link to="/search" className="hover:text-white">Search</Link></li>
              <li><Link to="/orders" className="hover:text-white">Track order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">Get help</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/70">
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white">Create account</Link></li>
              <li><Link to="/profile" className="hover:text-white">Account</Link></li>
              <li><Link to="/cart" className="hover:text-white">Your bags</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">For restaurants</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/70">
              <li><Link to="/portals" className="hover:text-white">Staff portals</Link></li>
              <li><Link to="/merchant" className="hover:text-white">Partner kitchen</Link></li>
              <li><Link to="/driver" className="hover:text-white">Ride with Zoomo</Link></li>
            </ul>
          </div>
        </div>

        <div className="mb-10">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">
            <MapPin className="size-3" /> Areas we ride
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <span key={a} className="rounded-full border border-white/15 px-3 py-1 text-[12px] text-white/70">
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Zoomo Eats · {TOWN}, Jammu</p>
          <p>Made for one town. That’s the point.</p>
        </div>
      </div>
    </footer>
  );
}
