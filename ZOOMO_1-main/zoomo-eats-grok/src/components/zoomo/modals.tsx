import { useState } from "react";
import { MapPin, RefreshCw, Search, ShoppingBag, X } from "lucide-react";
import { AREAS, COST_FOR_TWO, ETA, TOWN, type Restaurant } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export function LocationModal({
  onSet,
  onLater,
}: {
  onSet: (loc: string) => void;
  onLater: () => void;
}) {
  const [area, setArea] = useState(AREAS[0]);
  const [n, setN] = useState("");
  const [busy, setBusy] = useState(false);
  const captureLiveLocation = useZoomo((s) => s.captureLiveLocation);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] bg-surface p-8 shadow-lift">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-sage text-primary">
          <MapPin className="size-5" />
        </div>
        <h2 className="display mb-2 text-[28px] text-ink">Where in {TOWN}?</h2>
        <p className="mb-6 text-sm leading-6 text-sub">
          We only deliver inside town — pick your mohalla.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                area === a ? "bg-primary text-white" : "bg-page text-sub"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="relative mb-3">
          <MapPin className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-accent" />
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSet(n.trim() ? `${n.trim()}, ${area}` : area)}
            placeholder="House / street (optional)"
            className="field"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const a = await captureLiveLocation();
            setBusy(false);
            if (a) onSet(`${a.street}, ${a.city}`);
          }}
          className="btn-ghost mb-2 w-full py-3 text-sm"
        >
          {busy ? "Finding you…" : "Use current location"}
        </button>
        <button
          onClick={() => onSet(n.trim() ? `${n.trim()}, ${area}` : area)}
          className="btn-primary mb-2.5 w-full py-3.5 text-[15px]"
        >
          Deliver here
        </button>
        <button onClick={onLater} className="btn-ghost w-full py-3 text-sm">
          Keep Jourian
        </button>
      </div>
    </div>
  );
}

export function SearchOverlay({
  query,
  setQuery,
  results,
  onClose,
  onPick,
}: {
  query: string;
  setQuery: (q: string) => void;
  results: Restaurant[];
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-ink/50 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-b-[32px] bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kitchens, dishes, mohallas…"
            className="flex-1 bg-transparent text-[15px] outline-none"
          />
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-sub">Nothing in Jourian matches that.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => onPick(r.id)}
                className="flex w-full items-center gap-3.5 rounded-2xl p-3 text-left hover:bg-page"
              >
                <img src={r.imageUrl} alt="" className="size-[52px] shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold tracking-[-0.02em] text-ink">{r.name}</div>
                  <div className="mt-0.5 text-xs text-sub">
                    {r.area} · {r.cuisineType} · {ETA} · ₹{COST_FOR_TWO} for two
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function ConflictModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-[380px] rounded-[28px] bg-surface p-8 text-center shadow-lift">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-sage text-primary">
          <RefreshCw className="size-6" />
        </div>
        <h2 className="display mb-2 text-xl text-ink">Start a new cart?</h2>
        <p className="mb-6 text-sm leading-6 text-sub">
          Your cart has items from another kitchen. Adding this will clear the current bag.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="btn-ghost flex-1 py-2.5 text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1 py-2.5 text-sm">
            Yes, replace
          </button>
        </div>
      </div>
    </div>
  );
}

export function Loader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-page">
      <img src="/brand/mark-on-green.png" alt="" className="size-16 rounded-2xl object-cover" />
      <p className="text-sm font-medium text-sub">{text}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  cta,
  onCta,
}: {
  icon?: React.ReactNode;
  title: string;
  sub: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-sage text-primary">
        {icon ?? <ShoppingBag className="size-7" />}
      </div>
      <h3 className="display mb-1.5 text-xl text-ink">{title}</h3>
      <p className="mb-6 max-w-xs text-sm leading-6 text-sub">{sub}</p>
      {cta && onCta && (
        <button onClick={onCta} className="btn-primary px-6 py-3 text-sm">
          {cta}
        </button>
      )}
    </div>
  );
}
