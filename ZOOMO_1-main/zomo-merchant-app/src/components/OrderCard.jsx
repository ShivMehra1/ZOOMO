import StatusBadge from "./StatusBadge";
import { formatWhen } from "../lib/when";
import { isPickupType } from "../lib/order-labels";

// ✅ Order type badge for dine-in and takeaway
function OrderTypeBadge({ type }) {
  if (!type || type === "DELIVERY") return null;
  const cfg = {
    DINE_IN: { label: "Dine in", cls: "bg-z-sage text-z-primary" },
    TAKEAWAY: { label: "Pickup", cls: "bg-z-sage text-z-primary" },
    PICKUP: { label: "Pickup", cls: "bg-z-sage text-z-primary" },
  };
  const c = cfg[type];
  if (!c) return null;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${c.cls}`}>{c.label}</span>;
}

export default function OrderCard({ order, onClick }) {
  const isInStore = order.orderType === "DINE_IN" || isPickupType(order.orderType);

  return (
    <div onClick={onClick} className="card p-4 cursor-pointer transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">#{order.id.slice(0, 6)}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-lg font-bold text-z-ink">{order.customerName}</p>
            <OrderTypeBadge type={order.orderType} />
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isInStore && (
        <div className="mt-3 rounded-xl bg-z-page px-3 py-2 text-xs text-z-sub flex flex-wrap items-center gap-2">
          {order.scheduledFor && (
            <span>
              📅{" "}
              {formatWhen(order.scheduledFor)}
            </span>
          )}
          {order.orderType === "DINE_IN" && order.guestCount && (
            <span>· 👥 {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}</span>
          )}
          {!order.scheduledFor && <span className="text-z-muted">No time specified</span>}
        </div>
      )}

      <p className="mt-2 text-xs text-z-muted">Placed {formatWhen(order.createdAt)}</p>

      <div className="my-3 h-px bg-z-line-soft" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-z-sub">
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </span>
        <span className="text-lg font-bold text-z-ink tabular-nums">₹{order.total}</span>
      </div>
    </div>
  );
}
