import { statusLabel } from "../lib/order-labels";

export default function StatusBadge({ status }) {
  const tone = {
    SCHEDULED: "tone-wait",
    PENDING: "tone-wait",
    PREPARING: "tone-wait",
    READY_FOR_PICKUP: "tone-go",
    OUT_FOR_DELIVERY: "tone-go",
    DELIVERED: "tone-done",
    CANCELLED: "tone-stop",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
        tone[status] || "tone-wait"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
