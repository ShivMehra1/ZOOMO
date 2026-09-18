import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { sellState } from "@/lib/hours";

export function LiveHoursBanner() {
  const [now, setNow] = useState(() => sellState());
  useEffect(() => {
    const t = setInterval(() => setNow(sellState()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`border-b ${now.open ? "border-accent/20 bg-primary" : "border-line bg-ink"}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-white">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${now.open ? "bg-accent" : "bg-white/15"}`}>
          <Clock className="size-3.5" />
        </span>
        <div className="min-w-0 shrink-0">
          <p className="text-[12px] font-bold leading-tight">{now.label}</p>
          <p className="text-[10px] text-white/70">{now.detail}</p>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="hours-marquee flex w-max gap-8 text-[11px] font-semibold tracking-wide text-white/80 uppercase">
            {[...now.ticks, ...now.ticks].map((t, i) => (
              <span key={i} className="flex items-center gap-8">
                <span className="size-1 rounded-full bg-white/50" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
