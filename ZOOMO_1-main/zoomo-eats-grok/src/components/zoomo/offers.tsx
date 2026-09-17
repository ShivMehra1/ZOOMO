import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { COUPONS, OFFERS, restaurantById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export function OffersSection() {
  const nav = useNavigate();
  const { user, activatedOffers, toggleOffer } = useZoomo();
  const [flash, setFlash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  function activate(code: string) {
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    const result = toggleOffer(code);
    if (result === "full") {
      setToast("Two offers at a time — turn one off first");
      return;
    }
    if (result === "on") {
      setFlash(code);
      setToast(`${code} is on — it’ll apply at checkout`);
      setTimeout(() => setFlash(null), 500);
    } else {
      setToast(`${code} turned off`);
    }
  }

  return (
    <section id="offers" className="scroll-mt-28">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="kicker mb-1">For you this week</p>
          <h2 className="display text-[22px] text-ink">Offers</h2>
        </div>
      </div>

      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {OFFERS.map((o) => {
          const on = (activatedOffers ?? []).includes(o.code);
          const kitchen = o.restaurantId ? restaurantById(o.restaurantId) : null;
          const meta = COUPONS[o.code];
          const popping = flash === o.code;
          return (
            <article
              key={o.code}
              className={`w-[248px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-surface sm:w-[268px] ${
                on ? "offer-on" : "shadow-card"
              }`}
            >
              <div className="relative h-36">
                <img src={o.image} alt="" className="size-full object-cover" />
                <div className={`absolute inset-0 ${on ? "bg-primary/45" : "bg-gradient-to-t from-ink/70 to-transparent"}`} />
                {on && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-primary uppercase">
                    <Check className="size-3" /> On
                  </span>
                )}
                <span className="absolute bottom-2.5 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                  {meta?.label}
                </span>
              </div>
              <div className="flex min-h-[168px] flex-col p-4">
                <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{o.expires}</p>
                <h3 className="mt-1 text-[17px] leading-snug font-bold tracking-tight text-ink">{o.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-5 text-sub">{o.subtitle}</p>
                {kitchen && <p className="mb-3 text-[11px] font-medium text-muted">{kitchen.name}</p>}
                <button
                  onClick={() => activate(o.code)}
                  className={`h-11 w-full rounded-full text-[13px] font-bold transition-colors ${
                    on ? "bg-sage text-primary" : "bg-primary text-white"
                  } ${popping ? "btn-activate-pop" : ""}`}
                >
                  {on ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-4" /> Activated
                    </span>
                  ) : (
                    "Activate"
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Two offers at a time. They apply at checkout.</p>
      {toast && (
        // Sits above the sticky "View bag" cart bar (fixed at bottom-24 on
        // mobile, bottom-5 on desktop) — they were both anchored to the same
        // offset and rendering on top of each other.
        <div className="pointer-events-none fixed inset-x-0 bottom-40 z-[90] flex justify-center px-4 md:bottom-24">
          <p className="rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-lift">
            {toast}
          </p>
        </div>
      )}
    </section>
  );
}
