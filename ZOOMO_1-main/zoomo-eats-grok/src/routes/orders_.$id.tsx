import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGoBack } from "@/lib/zoomo-nav";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { OrderTracker, StatusPill, useTick } from "@/components/zoomo/tracker";
import { UberTrack } from "@/components/zoomo/uber-track";
import { inr, liveStatus, restaurantById } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/orders_/$id")({ component: OrderDetailPage });

function OrderDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const back = useGoBack("/orders");
  const order = useZoomo((s) => s.orders.find((o) => o.id === id));
  const cancelOrder = useZoomo((s) => s.cancelOrder);
  const [confirmCancel, setConfirmCancel] = useState(false);
  useTick(1000);

  const status = order ? liveStatus(order) : "PENDING";
  const active = Boolean(order) && status !== "DELIVERED" && status !== "CANCELLED";
  const kitchen = order ? restaurantById(order.restaurantId) : undefined;

  useEffect(() => {
    /* hydrate-safe no-op: keeps hook order if order is missing */
  }, [order]);

  if (!order) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sub">Order not found.</p>
        </div>
      </AppShell>
    );
  }

  if (order.orderType === "DELIVERY") {
    return <UberTrack order={order} />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-5 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={back}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-ink">{order.restaurantName}</h1>
            <p className="text-xs text-muted">#{order.id}</p>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="mb-4">
          <OrderTracker order={order} />
        </div>

        <div className="mb-4 rounded-[22px] bg-surface p-5 shadow-card">
          <h3 className="mb-3 text-[15px] font-bold text-ink">Items</h3>
          {order.items.map((i) => (
            <div key={i.dishId} className="mb-2 flex justify-between text-sm">
              <span className="text-sub">
                {i.name} × {i.quantity}
              </span>
              <span className="font-semibold text-ink">{inr(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-line-soft pt-2.5 text-[15px] font-bold text-ink">
            <span>Total</span>
            <span>{inr(order.total)}</span>
          </div>
        </div>

        {kitchen && !active && status === "DELIVERED" && (
          <button
            onClick={() => nav({ to: "/restaurant/$id", params: { id: kitchen.id } })}
            className="btn-primary mb-4 w-full py-3 text-sm"
          >
            Order again
          </button>
        )}

        {active && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full rounded-2xl bg-danger/10 py-3.5 text-sm font-bold text-danger"
          >
            Cancel order
          </button>
        )}
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-lift">
            <h3 className="text-[17px] font-bold text-ink">Cancel this bag?</h3>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmCancel(false)} className="btn-ghost flex-1 py-3 text-sm">
                Keep it
              </button>
              <button
                onClick={() => {
                  cancelOrder(order.id);
                  setConfirmCancel(false);
                }}
                className="flex-1 rounded-xl bg-danger py-3 text-sm font-bold text-white"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
