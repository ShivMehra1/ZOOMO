import { useState } from "react";
import { Bike, Check, Star, UtensilsCrossed } from "lucide-react";
import { inr, TIP_PRESETS } from "@/lib/zoomo-data";
import { useZoomo, type Order } from "@/lib/zoomo-store";

const EXTRA_TIPS = TIP_PRESETS.filter((n) => n > 0);

export function PostDeliveryCard({ order }: { order: Order }) {
  const { rateOrder, rateDriver, extraTip } = useZoomo();
  const [kitchenStars, setKitchenStars] = useState(order.rating || 0);
  const [kitchenNote, setKitchenNote] = useState(order.kitchenComment || "");
  const [driverStars, setDriverStars] = useState(order.driverRating || 0);
  const [driverNote, setDriverNote] = useState(order.driverComment || "");
  const [tipAmt, setTipAmt] = useState(0);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<"k" | "d" | "t" | null>(null);
  const [done, setDone] = useState("");

  const isDelivery = order.orderType === "DELIVERY";
  const driverName = order.driver?.name?.split(" ")[0] || "your driver";
  const kitchenSaved = Boolean(order.rating);
  const driverSaved = Boolean(order.driverRating);
  const tipped = (order.postDeliveryTip || 0) > 0;
  const extra = tipAmt || Number(custom) || 0;

  async function saveKitchen() {
    if (!kitchenStars) return;
    setBusy("k");
    try {
      await rateOrder(order.id, kitchenStars, kitchenNote.trim() || undefined);
      setDone("Thanks — that review is on the restaurant page.");
    } catch {
      /* store surfaces the error */
    } finally {
      setBusy(null);
    }
  }

  async function saveDriver() {
    if (!driverStars) return;
    setBusy("d");
    try {
      await rateDriver(order.id, driverStars, driverNote.trim() || undefined);
      setDone(`Thanks — ${driverName} will see that rating.`);
    } catch {
      /* store surfaces the error */
    } finally {
      setBusy(null);
    }
  }

  async function sendTip() {
    if (extra < 10) return;
    setBusy("t");
    try {
      await extraTip(order.id, extra);
      setDone(`₹${extra} added for ${driverName}.`);
      setTipAmt(0);
      setCustom("");
    } catch {
      /* store surfaces the error */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] bg-sage px-5 py-4">
        <p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Delivered</p>
        <h3 className="mt-1 text-[18px] font-bold tracking-tight text-ink">How was this bag?</h3>
        <p className="mt-1 text-[13px] text-sub">Reviews go live on the restaurant after delivery. Tip the rider if they did it right.</p>
      </div>

      <div className="rounded-[24px] bg-surface p-5 shadow-card">
        <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink">
          <UtensilsCrossed className="size-4 text-primary" /> {order.restaurantName}
        </p>
        <StarRow value={kitchenStars} onChange={kitchenSaved ? undefined : setKitchenStars} />
        {kitchenSaved ? (
          <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-primary">
            <Check className="size-3.5" /> Review posted
          </p>
        ) : (
          <>
            <textarea
              value={kitchenNote}
              onChange={(e) => setKitchenNote(e.target.value)}
              placeholder="Food, packing, timing…"
              rows={2}
              className="mt-3 w-full rounded-xl border-[1.5px] border-line bg-page px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={!kitchenStars || busy === "k"}
              onClick={saveKitchen}
              className="btn-primary mt-3 w-full py-2.5 text-[13px] disabled:opacity-50"
            >
              {busy === "k" ? "Saving…" : "Post kitchen review"}
            </button>
          </>
        )}
      </div>

      {isDelivery && order.driverId && (
        <div className="rounded-[24px] bg-surface p-5 shadow-card">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink">
            <Bike className="size-4 text-primary" /> {order.driver?.name || "Your driver"}
          </p>
          <StarRow value={driverStars} onChange={driverSaved ? undefined : setDriverStars} />
          {driverSaved ? (
            <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-primary">
              <Check className="size-3.5" /> Driver rated
            </p>
          ) : (
            <>
              <textarea
                value={driverNote}
                onChange={(e) => setDriverNote(e.target.value)}
                placeholder="On time? Careful with the bag?"
                rows={2}
                className="mt-3 w-full rounded-xl border-[1.5px] border-line bg-page px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!driverStars || busy === "d"}
                onClick={saveDriver}
                className="btn-primary mt-3 w-full py-2.5 text-[13px] disabled:opacity-50"
              >
                {busy === "d" ? "Saving…" : "Rate driver"}
              </button>
            </>
          )}
        </div>
      )}

      {isDelivery && order.driverId && (
        <div className="rounded-[24px] bg-surface p-5 shadow-card">
          <p className="text-[13px] font-bold text-ink">Tip {driverName}</p>
          <p className="mt-1 text-[12px] text-sub">Goes 100% to the rider, on top of anything you added at checkout.</p>
          {tipped ? (
            <p className="mt-3 flex items-center gap-1 text-[13px] font-bold text-primary">
              <Check className="size-3.5" /> Thank-you tip {inr(order.postDeliveryTip || 0)} sent
            </p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXTRA_TIPS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setTipAmt(n);
                      setCustom("");
                    }}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-bold ${
                      tipAmt === n && !custom ? "bg-primary text-white" : "bg-page text-ink"
                    }`}
                  >
                    ₹{n}
                  </button>
                ))}
              </div>
              <input
                inputMode="numeric"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value.replace(/[^\d]/g, ""));
                  setTipAmt(0);
                }}
                placeholder="Custom amount"
                className="mt-3 w-full rounded-xl border-[1.5px] border-line bg-page px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={extra < 10 || busy === "t"}
                onClick={sendTip}
                className="btn-primary mt-3 w-full py-2.5 text-[13px] disabled:opacity-50"
              >
                {busy === "t" ? "Sending…" : extra >= 10 ? `Send ${inr(extra)} tip` : "Tip delivery partner"}
              </button>
            </>
          )}
        </div>
      )}

      {done && <p className="text-center text-[13px] font-bold text-primary">{done}</p>}
    </div>
  );
}

function StarRow({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} stars`}
          className="p-0.5"
        >
          <Star className={`size-8 ${n <= value ? "fill-primary text-primary" : "text-line"}`} />
        </button>
      ))}
    </div>
  );
}
