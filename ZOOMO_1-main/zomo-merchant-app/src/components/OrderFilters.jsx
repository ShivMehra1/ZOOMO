import { ORDER_FILTERS } from "../utils/orderFilters";

export default function OrderFilters({ active, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(ORDER_FILTERS).map(([key, filter]) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`chip ${isActive ? "chip-on" : ""}`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
