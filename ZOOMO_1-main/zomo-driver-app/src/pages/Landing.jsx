// src/pages/Landing.jsx
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="w-full min-h-screen bg-z-page text-z-ink">
      {/* ================= HERO ================= */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6">
        <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-16 h-16 rounded-[22%] mb-6 object-contain" />

        <p className="kicker mb-3">Zoomo for Drivers</p>
        <h1 className="display text-4xl sm:text-6xl max-w-3xl text-z-ink">
          Ride your hours.
          <br />
          <span className="text-z-accent">We handle the routes.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-z-sub">
          Accept delivery requests, navigate to restaurants and customers, and track your
          daily earnings — all from one simple app.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="btn-primary !w-auto inline-flex h-12 px-8 text-base">
            Driver Login
          </Link>
          <a href="#how-it-works" className="btn-ghost !w-auto inline-flex h-12 px-8 text-base">
            See how it works
          </a>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-z-surface px-6 py-20">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature title="Live Delivery Requests" desc="Accept nearby orders in real-time and see pickup and drop-off details instantly." />
          <Feature title="Turn-by-Turn Routes" desc="Navigate to restaurants and customers with the fastest route to every stop." />
          <Feature title="Track Your Earnings" desc="Watch your daily and weekly earnings add up, payout by payout." />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="kicker mb-2">How it works</p>
          <h2 className="display text-3xl mb-12 text-z-ink">How Zoomo Works</h2>

          <div className="grid sm:grid-cols-3 gap-8">
            <Step number="1" title="Sign In">Use your registered driver credentials to get started.</Step>
            <Step number="2" title="Go Online">Mark yourself available to start receiving requests.</Step>
            <Step number="3" title="Ride & Earn">Pick up, deliver, and watch your earnings grow.</Step>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-z-surface px-6 py-20 text-center">
        <h2 className="display text-3xl text-z-ink">Ready to start riding?</h2>
        <p className="mt-3 text-z-sub">
          Sign in with your registered driver account to go online.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="btn-primary !w-auto inline-flex h-12 px-8 text-base">
            Driver Login
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-8 text-center text-sm text-z-muted">
        © {new Date().getFullYear()} Zoomo Eats. All rights reserved.
      </footer>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Feature({ title, desc }) {
  return (
    <div className="card p-6 transition hover:shadow-lift">
      <h3 className="text-lg font-bold mb-2 text-z-ink">{title}</h3>
      <p className="text-sm text-z-sub">{desc}</p>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-z-primary text-white flex items-center justify-center font-bold text-lg">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-1 text-z-ink">{title}</h3>
      <p className="text-sm text-z-sub">{children}</p>
    </div>
  );
}
