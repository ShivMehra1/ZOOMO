/** Same labels as customer / admin / driver — Uber Eats / Zomato style. */
export const STATUS_LABEL = {
  SCHEDULED: "Scheduled",
  PENDING: "New",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function statusLabel(status) {
  return STATUS_LABEL[status] || String(status || "").replaceAll("_", " ");
}

export function isPickupType(type) {
  return type === "PICKUP" || type === "TAKEAWAY";
}

export function typeLabel(type) {
  if (type === "DINE_IN") return "Dine in";
  if (isPickupType(type)) return "Pickup";
  return "Delivery";
}
