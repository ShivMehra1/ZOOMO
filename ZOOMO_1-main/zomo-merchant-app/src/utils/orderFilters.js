export const ORDER_FILTERS = {
  ALL: {
    label: "All",
    match: () => true,
  },
  PENDING: {
    label: "Pending",
    match: (order) => order.status === "PENDING",
  },
  ACTIVE: {
    label: "Active",
    match: (order) =>
      order.status === "PREPARING" ||
      order.status === "READY_FOR_PICKUP" ||
      order.status === "OUT_FOR_DELIVERY",
  },
  COMPLETED: {
    label: "Completed",
    match: (order) => order.status === "DELIVERED",
  },
  CANCELLED: {
    label: "Cancelled",
    match: (order) => order.status === "CANCELLED",
  },
};
