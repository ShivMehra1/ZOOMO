import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  ORDER_STATUS,
  etaMinOf,
  etaMinutes,
  liveProgress,
  liveStatus,
  restaurantById,
  stepsFor,
} from "@/lib/zoomo-data";
import type { Order } from "@/lib/zoomo-store";

export function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function StatusPill({ status }: { status: string }) {
  const meta = ORDER_STATUS[status] || { label: status, tone: "wait" as const };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tone-${meta.tone}`}>
      {meta.label}
    </span>
  );
}

export function OrderTracker({ order }: { order: Order }) {
  useTick(5000);
  const status = liveStatus(order);
  const progress = liveProgress(order);
  const steps = stepsFor(order.orderType);
  const kitchen = restaurantById(order.restaurantId);
  const mins = etaMinOf(kitchen) || etaMinutes(order) || 22;
  const dest = order.address?.street || order.address?.city || "your place";
  const idx = Math.max(0, steps.findIndex((s) => s.key === status));

  return (
    <div className="overflow-hidden rounded-[28px] bg-surface shadow-card">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Tracking</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
              {kitchen?.name ? `${kitchen.name} has your order` : ORDER_STATUS[status]?.label ?? status}
            </h2>
            <p className="mt-1 text-sm text-sub">
              {status === "DELIVERED" ? "Enjoy your food" : `Your food is about ${mins} minutes away`}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-page">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {order.orderType === "DELIVERY" && (
          <p className="mt-2 text-[12px] text-muted">
            {kitchen?.name || order.restaurantName} · Jourian → {dest}
          </p>
        )}
      </div>

      <ol className="space-y-0 px-5 py-4">
        {steps.map((s, i) => {
          const done = i < idx || status === steps[steps.length - 1].key;
          const current = i === idx && status !== "DELIVERED";
          return (
            <li key={s.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-6 items-center justify-center rounded-full ${
                    done || current ? "bg-primary text-white" : "bg-sage text-muted"
                  }`}
                >
                  {done && !current ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                {i < steps.length - 1 && <span className={`h-6 w-px ${done ? "bg-primary" : "bg-line"}`} />}
              </div>
              <div className="pb-3">
                <p className={`text-sm font-bold ${current || done ? "text-ink" : "text-muted"}`}>{s.label}</p>
                <p className="text-xs text-sub">{s.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ActiveOrderBanner({ order, onOpen }: { order: Order; onOpen: () => void }) {
  useTick(1000);
  const status = liveStatus(order);
  if (status === "DELIVERED" || status === "CANCELLED") return null;
  const kitchen = restaurantById(order.restaurantId);
  const mins = etaMinOf(kitchen) || etaMinutes(order) || 22;
  const progress = liveProgress(order);
  return (
    <button
      onClick={onOpen}
      className="w-full overflow-hidden rounded-[22px] bg-primary text-left text-white shadow-lift"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-white/50 uppercase">Live order</p>
          <p className="truncate text-sm font-bold">{order.restaurantName} has your order</p>
          <p className="text-xs text-white/65">
            Your food is about {mins} minutes away
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary">Map</span>
      </div>
      <div className="h-1 bg-white/15">
        <div className="h-full bg-white" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </button>
  );
}
