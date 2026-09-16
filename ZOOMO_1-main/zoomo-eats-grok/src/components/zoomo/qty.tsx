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
    <div className="flex items-center rounded-lg border border-line bg-page">
      <button
        type="button"
        onClick={onLess}
        className="flex size-7 items-center justify-center text-ink"
        aria-label="Less"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-[13px] font-bold tabular">{value}</span>
      <button
        type="button"
        onClick={onMore}
        className="flex size-7 items-center justify-center text-primary"
        aria-label="More"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
