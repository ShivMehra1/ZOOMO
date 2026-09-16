import { useEffect, useMemo, useRef, useState } from "react";
import { Bike } from "lucide-react";
import { JOURIAN_BOUNDS, bearing, kmBetween, posOnLegs, uberLegs, type LatLng } from "@/lib/geo";

function pct(p: LatLng) {
  const [[lat0, lng0], [lat1, lng1]] = JOURIAN_BOUNDS;
  return {
    x: ((p.lng - lng0) / (lng1 - lng0)) * 100,
    y: ((lat1 - p.lat) / (lat1 - lat0)) * 100,
  };
}

function poly(pts: LatLng[]) {
  return pts
    .map((p) => {
      const q = pct(p);
      return `${q.x},${q.y}`;
    })
    .join(" ");
}

export function LiveRideMap({
  from,
  to,
  ride,
  showRider,
  nearby,
}: {
  from?: string | null;
  to?: string | null;
  ride: number;
  showRider: boolean;
  nearby?: boolean;
}) {
  const tiles = useRef<HTMLDivElement>(null);
  const [smooth, setSmooth] = useState(ride);
  const legs = useMemo(() => uberLegs(from, to), [from, to]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setSmooth((s) => {
        const d = ride - s;
        if (Math.abs(d) < 0.002) return ride;
        return s + d * 0.12;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ride]);

  const { pos, nxt, leg } = posOnLegs(legs.toShop, legs.toYou, smooth);
  const deg = bearing(pos, nxt);
  const shop = pct(legs.shop);
  const you = pct(legs.you);
  const r = pct(pos);
  const km = kmBetween(pos, legs.you);

  useEffect(() => {
    const box = tiles.current;
    if (!box) return;
    let map: { remove: () => void } | null = null;
    let dead = false;

    (async () => {
      try {
        const mod = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        const L = (mod as { default?: typeof import("leaflet") }).default ?? (mod as typeof import("leaflet"));
        if (dead || !box || typeof L.map !== "function") return;
        const m = L.map(box, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: false,
          minZoom: 13,
          maxZoom: 16,
        });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
        }).addTo(m);
        m.fitBounds(
          [
            [legs.spawn.lat, legs.spawn.lng],
            [legs.you.lat, legs.you.lng],
            [legs.shop.lat, legs.shop.lng],
          ],
          { padding: [56, 56], maxZoom: 15 },
        );
        setTimeout(() => m.invalidateSize(), 60);
        setTimeout(() => m.invalidateSize(), 280);
        map = m;
      } catch {
        /* overlay still shows the ride */
      }
    })();

    return () => {
      dead = true;
      map?.remove();
    };
  }, [legs.shop.lat, legs.shop.lng, legs.you.lat, legs.you.lng, legs.spawn.lat, legs.spawn.lng]);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden bg-[#d7e6de]">
      <div ref={tiles} className="leaflet-container absolute inset-0 z-0 size-full" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-primary/10 via-transparent to-primary/20" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-10 size-full">
        <polyline
          points={poly(legs.toYou)}
          fill="none"
          stroke="#0f3d2d"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={leg === "toYou" || leg === "done" ? 1 : 0.28}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={poly(legs.toShop)}
          fill="none"
          stroke="#0f3d2d"
          strokeWidth="2.2"
          strokeDasharray={leg === "toShop" ? undefined : "3 4"}
          strokeLinecap="round"
          opacity={leg === "toShop" ? 0.9 : 0.25}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <Pin x={shop.x} y={shop.y} label="Restaurant" />
      <Pin x={you.x} y={you.y} label="You" accent />

      {showRider && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-300 ease-linear"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}
        >
          {nearby && <span className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-accent/30" />}
          <span className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20" />
          <div
            className="relative flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lift"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <Bike className="size-5" />
          </div>
        </div>
      )}

      <p className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-ink uppercase shadow-sm">
        {leg === "toShop" ? "Heading to restaurant" : leg === "done" ? "At your gate" : `${km.toFixed(1)} km away`}
      </p>
    </div>
  );
}

function Pin({ x, y, label, accent }: { x: number; y: number; label: string; accent?: boolean }) {
  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className={`mx-auto mb-1 block size-3.5 rounded-full border-2 border-white shadow ${accent ? "bg-accent" : "bg-primary"}`} />
      <span className="block -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
        {label}
      </span>
    </div>
  );
}
