import { useLayoutEffect, useRef, useState } from "react";
import { Bike } from "lucide-react";
import { MAP_NODES, mapNode, routePath } from "@/lib/zoomo-data";

const ROADS = [
  "M4 46 C 24 42, 40 48, 52 44 C 68 40, 84 50, 96 52",
  "M50 8 C 51 24, 52 36, 52 44 C 51 60, 54 78, 55 96",
  "M12 18 C 28 28, 40 38, 52 44",
  "M88 16 C 74 28, 62 38, 52 44",
  "M10 72 C 26 62, 40 52, 52 44",
  "M90 74 C 74 62, 62 52, 52 44",
  "M20 92 C 34 76, 44 56, 52 44",
  "M76 94 C 66 76, 56 56, 52 44",
];

export function SchematicMap({
  selected,
  onPick,
  from,
  to,
  ride = 0,
  showRider = false,
  tall = false,
}: {
  selected?: string | null;
  onPick?: (area: string) => void;
  from?: string | null;
  to?: string | null;
  ride?: number;
  showRider?: boolean;
  tall?: boolean;
}) {
  const a = from ? mapNode(from) : null;
  const b = to ? mapNode(to) : null;
  const d = from && to ? routePath(from, to) : "";

  return (
    <div className={`relative w-full overflow-hidden bg-[#eef3f0] ${tall ? "h-full min-h-[220px]" : "aspect-[4/3] rounded-[20px]"}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <rect width="100" height="100" fill="#eef3f0" />
        <circle cx="52" cy="44" r="28" fill="#d7e6de" />
        {ROADS.map((road) => (
          <path key={road} d={road} fill="none" stroke="#0f3d2d" strokeWidth="1.8" strokeLinecap="round" />
        ))}
        {ROADS.map((road) => (
          <path key={`i-${road}`} d={road} fill="none" stroke="#fff" strokeWidth="0.6" strokeLinecap="round" />
        ))}
        {d && <path d={d} fill="none" stroke="#1f7a52" strokeWidth="2" strokeLinecap="round" />}
        <FollowPath d={d} t={ride} />
        {MAP_NODES.map((n, i) => {
          const on = selected === n.name || a?.name === n.name || b?.name === n.name;
          return (
            <g key={n.name} className={onPick ? "cursor-pointer" : undefined} onClick={() => onPick?.(n.name)}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.hub ? 5 : 4}
                fill={on || n.hub ? "#0f3d2d" : "#fff"}
                stroke="#0f3d2d"
                strokeWidth="1"
              />
              <text
                x={n.x}
                y={n.y + 1.4}
                textAnchor="middle"
                fill={on || n.hub ? "#fff" : "#0f3d2d"}
                fontSize="4"
                fontWeight="700"
                style={{ fontFamily: "Satoshi, sans-serif" }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      {showRider && d ? <RiderPin d={d} t={ride} /> : null}
    </div>
  );
}

function FollowPath({ d, t }: { d: string; t: number }) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setLen(ref.current.getTotalLength());
  }, [d]);
  if (!d) return null;
  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke="#1f7a52"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeDasharray={len || 1}
      strokeDashoffset={(len || 1) * (1 - t)}
    />
  );
}

function RiderPin({ d, t }: { d: string; t: number }) {
  const ref = useRef<SVGPathElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const len = el.getTotalLength();
    const pt = el.getPointAtLength(len * Math.max(0, Math.min(1, t)));
    setPos({ x: pt.x, y: pt.y });
  }, [d, t]);
  return (
    <>
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full opacity-0">
        <path ref={ref} d={d} />
      </svg>
      {pos && (
        <div
          className="pointer-events-none absolute z-[2] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lift"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <Bike className="size-3.5" />
        </div>
      )}
    </>
  );
}
