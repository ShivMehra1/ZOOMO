import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { OrderTracker, StatusPill, useTick } from "@/components/zoomo/tracker";
import { UberTrack } from "@/components/zoomo/uber-track";
import { inr, liveStatus, restaurantById } from "@/lib/zoomo-data";
import { formatWhen } from "@/lib/when";
import { useZoomo, type Order } from "@/lib/zoomo-store";
import { realGetOrder, toStoreOrder } from "@/lib/real-api";
import { PostDeliveryCard } from "@/components/zoomo/post-delivery";

export const Route = createFileRoute("/orders_/$id")({ component: OrderDetailPage });

function OrderDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const storeOrder = useZoomo((s) => s.orders.find((o) => o.id === id));
  const cancelOrder = useZoomo((s) => s.cancelOrder);
  const reorder = useZoomo((s) => s.reorder);
  const [fetched, setFetched] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!storeOrder);
  const [confirmCancel, setConfirmCancel] = useState(false);
  useTick(1000);

  useEffect(() => {
    if (storeOrder) {
      setFetched(storeOrder);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    realGetOrder(id)
      .then((raw) => {
        if (cancelled || !raw?.id) return;
        const mapped = toStoreOrder(raw) as Order;
        useZoomo.setState((s) => ({
          orders: [mapped, ...s.orders.filter((o) => o.id !== mapped.id)],
        }));
        setFetched(mapped);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, storeOrder]);

  const order = storeOrder || fetched;
  const status = order ? liveStatus(order) : "PENDING";
  const active = Boolean(order) && status !== "DELIVERED" && status !== "CANCELLED";
  const kitchen = order ? restaurantById(order.restaurantId) : undefined;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-lg font-bold text-ink">Order not found</p>
          <p className="text-sm text-sub">It may still be landing. Check Orders in a moment.</p>
          <button type="button" onClick={() => nav({ to: "/orders", replace: true })} className="btn-primary px-5 py-2.5 text-sm">
            My orders
          </button>
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
            onClick={() => nav({ to: "/orders", replace: true })}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-ink">{order.restaurantName}</h1>
            <p className="text-xs text-muted">#{order.id.slice(0, 8)} · Placed {formatWhen(order.createdAt)}</p>
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
          <div className="mt-3 space-y-1.5 border-t border-line-soft pt-3 text-[13px] text-sub">
            <div className="flex justify-between"><span>Items</span><span className="tabular">{inr(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span className="tabular">{order.deliveryFee > 0 ? inr(order.deliveryFee) : "FREE"}</span></div>
            <div className="flex justify-between"><span>GST (5%)</span><span className="tabular">{inr(order.tax)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-veg"><span>Promo</span><span className="tabular">−{inr(order.discount)}</span></div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-primary"><span>Tip</span><span className="tabular">{inr(order.tip)}</span></div>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-line-soft pt-2.5 text-[15px] font-bold text-ink">
            <span>Total</span>
            <span className="tabular text-primary">{inr(order.total)}</span>
          </div>
        </div>

        {status === "DELIVERED" && (
          <div className="mb-4 space-y-3">
            <PostDeliveryCard order={order} />
            {kitchen && (
              <button
                type="button"
                onClick={() => {
                  if (reorder(order.id) === "ok") nav({ to: "/cart" });
                }}
                className="btn-primary w-full py-3 text-sm"
              >
                Order again
              </button>
            )}
          </div>
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
