// ✅ orderType prop added — dine-in/takeaway have a different
// status flow that skips OUT_FOR_DELIVERY entirely.
//
// DELIVERY flow:   PENDING → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → (driver confirms DELIVERED)
// DINE_IN flow:    PENDING → PREPARING → READY_FOR_PICKUP → DELIVERED
// TAKEAWAY flow:   PENDING → PREPARING → READY_FOR_PICKUP → DELIVERED

export default function OrderStatusActions({ status, orderType = "DELIVERY", onUpdate }) {
  const isInStore = orderType === "DINE_IN" || orderType === "TAKEAWAY";

  // For delivery orders that are out for delivery, driver handles the final step
  if (!isInStore && status === "OUT_FOR_DELIVERY") {
    return (
      <div className="px-4 py-3 rounded-xl bg-z-sage text-sm text-z-primary font-bold">
        Order is with the driver. Delivery will be confirmed by the driver.
      </div>
    );
  }

  // ✅ Dine-in / Takeaway: skip OUT_FOR_DELIVERY, go straight to DELIVERED
  const ACTIONS_DELIVERY = {
    PENDING: { label: "Accept Order", next: "PREPARING" },
    PREPARING: { label: "Mark Ready", next: "READY_FOR_PICKUP" },
    READY_FOR_PICKUP: { label: "Out for Delivery", next: "OUT_FOR_DELIVERY" },
  };

  const ACTIONS_IN_STORE = {
    PENDING: { label: "Accept Order", next: "PREPARING" },
    PREPARING: { label: "Mark Ready", next: "READY_FOR_PICKUP" },
    // ✅ Final step — customer is present, mark complete directly
    READY_FOR_PICKUP: {
      label: orderType === "DINE_IN" ? "Mark Served 🍽️" : "Mark Collected 🥡",
      next: "DELIVERED",
    },
  };

  const ACTIONS = isInStore ? ACTIONS_IN_STORE : ACTIONS_DELIVERY;
  const action = ACTIONS[status];

  if (!action) return null;

  return (
    <button onClick={() => onUpdate(action.next)} className="btn-primary h-11 flex-1 text-sm">
      {action.label}
    </button>
  );
}
