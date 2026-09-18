export const STATUS_LABEL = {
  SCHEDULED: "Scheduled",
  PENDING: "New",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function statusLabel(status) {
  return STATUS_LABEL[status] || String(status || "").replaceAll("_", " ");
}
