import { MAP_NODES, TOWN } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

function mapSrc(area: string | null) {
  const q = encodeURIComponent(`${area && area !== TOWN ? `${area}, ` : ""}Jourian, Jammu and Kashmir, India`);
  return `https://www.google.com/maps?q=${q}&z=13&hl=en&output=embed`;
}

export function ZoneMap({ onPick }: { onPick: (area: string) => void }) {
  const location = useZoomo((s) => s.location);

  return (
    <section className="overflow-hidden rounded-[28px] bg-surface shadow-card">
      <div className="flex items-end justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <div>
          <p className="kicker mb-1">Delivery zone</p>
          <h2 className="display text-[22px] text-ink">Areas we ride</h2>
        </div>
        <p className="text-[12px] font-bold text-muted">Jammu, India</p>
      </div>
      <div className="grid gap-4 px-4 pb-5 sm:px-5 md:grid-cols-[1.4fr_0.8fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-sage">
          <iframe
            title="Jourian delivery map"
            src={mapSrc(location)}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <ol className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3 md:grid-cols-1">
          {MAP_NODES.map((n, i) => {
            const on = location === n.name;
            return (
              <li key={n.name}>
                <button
                  type="button"
                  onClick={() => onPick(n.name)}
                  className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[13px] font-bold ${
                    on ? "bg-primary text-white" : "bg-page text-ink"
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular ${
                      on ? "bg-white text-primary" : "bg-sage text-primary"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {n.name === TOWN ? "Jourian town" : n.name}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
