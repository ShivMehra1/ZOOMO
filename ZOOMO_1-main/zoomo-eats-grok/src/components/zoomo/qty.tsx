import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onLess,
  onMore,
}: {
  value: number;
  onLess: () => void;
  onMore: () => void;
}) {
  return (
    <div className="flex items-center rounded-xl border border-line bg-page">
      <button
        type="button"
        onClick={onLess}
        className="flex size-11 items-center justify-center text-ink"
        aria-label="Less"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-7 text-center text-sm font-bold tabular">{value}</span>
      <button
        type="button"
        onClick={onMore}
        className="flex size-11 items-center justify-center text-primary"
        aria-label="More"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
