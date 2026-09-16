import { Search, X } from "lucide-react";
import { IMG, PUNCHLINE } from "@/lib/zoomo-data";

export function HomeHero({
  onSearchFocus,
  query,
  setQuery,
}: {
  onSearchFocus: () => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <video
        className="absolute inset-0 size-full object-cover"
        src={IMG.heroVideo}
        poster={IMG.burger}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-primary/38" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/72 via-primary/28 to-transparent" />

      <div className="relative mx-auto flex min-h-[520px] w-full max-w-6xl flex-col justify-center px-5 py-16 sm:min-h-[560px] sm:py-20">
        <p className="mb-6 inline-flex w-fit items-center rounded-full border border-white/25 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] text-white/90 uppercase">
          Live in Jourian
        </p>
        <h1 className="display max-w-3xl text-[clamp(2.8rem,8vw,5.2rem)] leading-[0.95] text-white">
          Whatever you're craving.
          <span className="mt-1 block text-white/55">At the door.</span>
        </h1>
        <p className="mt-5 text-[18px] font-semibold tracking-wide text-white sm:text-[22px]">{PUNCHLINE}</p>
        <p className="mt-2 max-w-md text-[15px] leading-6 text-white/70">
          Set your street, pick a restaurant, watch the bag move.
        </p>
        <div className="relative mt-8 w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="Search food or restaurants"
            className="h-14 w-full rounded-full bg-white pr-11 pl-12 text-[15px] text-ink shadow-lift outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
