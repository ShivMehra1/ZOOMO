import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Shield, Store, UtensilsCrossed } from "lucide-react";
import { ZoomoMark } from "@/components/zoomo/mark";
import { PUNCHLINE } from "@/lib/zoomo-data";

export const Route = createFileRoute("/portals")({ component: PortalsPage });

const CARDS = [
  {
    to: "/",
    icon: UtensilsCrossed,
    title: "Customer",
    hint: "Order in Jourian. Track the bag.",
    cta: "Order",
  },
  {
    to: "/merchant",
    icon: Store,
    title: "Kitchen",
    hint: "Tickets, accept, plate, mark ready.",
    cta: "Open kitchen",
  },
  {
    to: "/driver",
    icon: Bike,
    title: "Rider",
    hint: "Pick up, ride, call, deliver.",
    cta: "Start riding",
  },
  {
    to: "/admin",
    icon: Shield,
    title: "HQ",
    hint: "All bags. Assign riders. Status.",
    cta: "Open HQ",
  },
] as const;

function PortalsPage() {
  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-12 flex items-center gap-3">
          <ZoomoMark size={44} onGreen />
          <div>
            <p className="text-lg font-bold tracking-tight">Zoomo Eats</p>
            <p className="text-xs font-medium text-white/55">{PUNCHLINE}</p>
          </div>
        </div>
        <p className="kicker mb-2 text-white/45">One platform</p>
        <h1 className="display mb-3 max-w-xl text-4xl">Customer, kitchen, rider, HQ — same Jourian stack.</h1>
        <p className="mb-10 max-w-lg text-sm leading-6 text-white/65">
          Place an order as a customer, accept it in the kitchen, ride it as Ravi, watch it in HQ.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-[28px] bg-white/8 p-6 transition hover:bg-white/12"
            >
              <c.icon className="size-7 text-accent" />
              <h2 className="mt-4 text-xl font-bold">{c.title}</h2>
              <p className="mt-1 text-sm text-white/60">{c.hint}</p>
              <p className="mt-6 text-sm font-bold text-accent">{c.cta} →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
