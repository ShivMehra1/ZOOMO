import StatusBadge from "./StatusBadge";

// ✅ Order type badge for dine-in and takeaway
function OrderTypeBadge({ type }) {
  if (!type || type === "DELIVERY") return null;
  const cfg = {
    DINE_IN: { label: "🍽️ Dine In", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/30" },
    TAKEAWAY: { label: "🥡 Takeaway", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30" },
  };
  const c = cfg[type];
  if (!c) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.cls}`}>
      {c.label}
    </span>
  );
}

export default function OrderCard({ order, onClick }) {
  const isInStore = order.orderType === "DINE_IN" || order.orderType === "TAKEAWAY";

  return (
    <div
      onClick={onClick}
      className="
        cursor-pointer
        rounded-2xl
        bg-white/90 dark:bg-[#141414]
        border border-black/5 dark:border-white/10
        p-4
        transition
        hover:shadow-lg
        hover:-translate-y-0.5
      "
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Order #{order.id.slice(0, 6)}
            </h3>
            {/* ✅ Order type badge shown alongside order number */}
            <OrderTypeBadge type={order.orderType} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {order.customerName}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* ✅ Dine-in / Takeaway details row — replaces delivery address */}
      {isInStore && (
        <div className="mt-3 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
            {order.scheduledFor && (
              <span>
                📅 {new Date(order.scheduledFor).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
            {order.orderType === "DINE_IN" && order.guestCount && (
              <span>· 👥 {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}</span>
            )}
            {!order.scheduledFor && (
              <span className="text-gray-400">No time specified</span>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-3 h-px bg-black/5 dark:bg-white/10" />

      {/* Bottom row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          ₹{order.total}
        </span>
      </div>
    </div>
  );
}