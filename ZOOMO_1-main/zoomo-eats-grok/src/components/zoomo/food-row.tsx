import { FoodImg } from "./food-img";
import { CATEGORIES } from "@/lib/zoomo-data";

export function FoodRow({
  chip,
  onChip,
}: {
  chip: string;
  onChip: (id: string) => void;
}) {
  return (
    <section className="mb-12">
      <p className="kicker mb-4">Cravings</p>
      <div className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => {
          const on = chip === c.id;
          return (
            <button key={c.id} onClick={() => onChip(on ? "All" : c.id)} className="w-[70px] shrink-0 text-center">
              <span
                className={`mx-auto flex size-[64px] items-center justify-center overflow-hidden rounded-full bg-surface shadow-card ${
                  on ? "ring-2 ring-primary ring-offset-2 ring-offset-page" : ""
                }`}
              >
                <FoodImg src={c.image} alt="" className="size-full object-cover" />
              </span>
              <span className={`mt-2 block text-[12px] font-bold ${on ? "text-primary" : "text-ink"}`}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
