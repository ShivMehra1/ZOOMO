import { CUISINES } from "@/lib/zoomo-data";

export function CuisineChips({
  value,
  onChange,
}: {
  value: (typeof CUISINES)[number];
  onChange: (c: (typeof CUISINES)[number]) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {CUISINES.map((c) => (
        <button key={c} onClick={() => onChange(c)} className={`chip ${value === c ? "chip-on" : ""}`}>
          {c}
        </button>
      ))}
    </div>
  );
}
