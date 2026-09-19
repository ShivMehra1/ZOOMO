import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiClock, FiPackage, FiTrendingUp, FiDollarSign } from "react-icons/fi";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import {
  fetchDeliveryHistory,
  fetchPayoutBalance,
  fetchPayouts,
  requestPayout,
} from "../services/driverApi";
import { useDriverSocket } from "../hooks/useDriverSocket";
import { formatWhen } from "../lib/when";
import { statusLabel } from "../lib/order-labels";

const METHODS = [
  { id: "UPI", label: "UPI", placeholder: "your-id@upi" },
  { id: "BANK_TRANSFER", label: "Bank transfer", placeholder: "Account number" },
  { id: "CASH", label: "Cash", placeholder: null },
];

const PAYOUT_TONE = { PENDING: "tone-wait", APPROVED: "tone-go", COMPLETED: "tone-go", REJECTED: "tone-stop" };

function proofSrc(url) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return url.startsWith("/") ? `${base}${url}` : url;
}

function CashOutCard() {
  const socket = useDriverSocket();
  const [balance, setBalance] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetchPayoutBalance().then(setBalance).catch(() => {});
    fetchPayouts().then(setPayouts).catch(() => {});
  };

  useEffect(() => {
    load();
    socket.on("payout:updated", load);
    return () => socket.off("payout:updated", load);
  }, [socket]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    setSubmitting(true);
    try {
      await requestPayout({ amount: amt, method, payoutDetail: detail || undefined });
      setOpen(false);
      setAmount("");
      setDetail("");
      load();
    } catch (err) {
      setError(err.message || "Failed to request payout");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMethod = METHODS.find((m) => m.id === method);

  return (
    <div className="rounded-card p-5 shadow-card bg-z-surface mb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">Available to cash out</p>
        <FiDollarSign className="text-z-primary" size={16} />
      </div>
      <p className="display text-3xl text-z-ink mb-4">
        {balance ? `₹${balance.available.toFixed(0)}` : "—"}
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={!balance || balance.available <= 0}
          className="btn-primary h-12 text-sm"
        >
          Cash out
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="text-xs text-z-danger">{error}</p>}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (max ₹${balance?.available.toFixed(0) ?? 0})`}
            max={balance?.available}
            className="field h-12"
          />
          <div className="flex gap-2">
            {METHODS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`selectable flex-1 h-11 ${method === m.id ? "selectable-on" : ""}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {selectedMethod?.placeholder && (
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={selectedMethod.placeholder}
              className="field h-12"
            />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-12 text-sm flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary h-12 text-sm flex-1">
              {submitting ? "Requesting..." : "Request payout"}
            </button>
          </div>
        </form>
      )}

      {payouts.length > 0 && (
        <div className="mt-5 pt-4 border-t border-z-line-soft space-y-2">
          <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-2">Payout history</p>
          {payouts.map((p) => (
            <div key={p.id} className="flex items-start justify-between text-sm gap-3">
              <div>
                <span className="font-bold text-z-ink">₹{p.amount.toFixed(0)}</span>{" "}
                <span className="text-z-sub text-xs">· {p.method.replace("_", " ")}</span>
                <p className="text-[11px] text-z-muted mt-0.5">Requested {formatWhen(p.createdAt)}</p>
                {p.status === "COMPLETED" && p.updatedAt && (
                  <p className="text-[11px] text-z-muted">Paid {formatWhen(p.updatedAt)}</p>
                )}
                {p.status === "APPROVED" && (
                  <p className="text-[11px] text-z-primary font-semibold mt-0.5">You'll be paid within 24 hours.</p>
                )}
                {p.paymentProofUrl && (
                  <a href={proofSrc(p.paymentProofUrl)} target="_blank" rel="noreferrer">
                    <img src={proofSrc(p.paymentProofUrl)} alt="Payment proof" className="mt-2 h-16 w-28 rounded-lg object-cover" />
                  </a>
                )}
              </div>
              <span className={`badge ${PAYOUT_TONE[p.status]}`}>{p.status === "APPROVED" ? "Approved" : p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function EarningsChart({ days }) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  return (
    <div className="rounded-card p-5 shadow-card bg-z-surface">
      <h3 className="text-z-ink font-semibold mb-4">Last 7 days</h3>
      <div className="flex items-end gap-1.5 h-36">
        {days.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
              <div
                className="w-full bg-z-primary rounded-t hover:bg-z-hover transition-all"
                style={{ height: `${Math.max((d.amount / max) * 120, 2)}px` }}
                title={`₹${d.amount.toFixed(0)} · ${d.count} deliveries`}
              />
            </div>
            <span className="text-z-muted text-[10px]">{d.date.slice(-2).replace(/^0/, "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Earnings() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeliveryHistory()
      .then(setHistory)
      .catch(() => setError("Failed to load earnings"));
  }, []);

  const stats = useMemo(() => {
    if (!history) return null;
    const delivered = history.filter((o) => o.status === "DELIVERED");
    const today = dayKey(new Date());

    const pay = (o) => o.deliveryFee ?? o.total ?? 0;
    const tipOf = (o) => Number(o.tip || 0) + Number(o.postDeliveryTip || 0);

    const todayEarnings = delivered
      .filter((o) => o.actualDeliveryTime && dayKey(o.actualDeliveryTime) === today)
      .reduce((s, o) => s + pay(o) + tipOf(o), 0);

    const weekEarnings = delivered.reduce((s, o) => s + pay(o) + tipOf(o), 0);
    const tipsTotal = delivered.reduce((s, o) => s + tipOf(o), 0);

    const buckets = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(dayKey(d), { date: dayKey(d), amount: 0, count: 0 });
    }
    for (const o of delivered) {
      if (!o.actualDeliveryTime) continue;
      const key = dayKey(o.actualDeliveryTime);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.amount += pay(o);
        bucket.count += 1;
      }
    }

    const onTimeEligible = delivered.filter((o) => o.estimatedDeliveryTime && o.actualDeliveryTime);
    const onTime = onTimeEligible.filter(
      (o) => new Date(o.actualDeliveryTime) <= new Date(o.estimatedDeliveryTime)
    );
    const onTimeRate = onTimeEligible.length ? Math.round((onTime.length / onTimeEligible.length) * 100) : null;

    return {
      todayEarnings,
      weekEarnings,
      tipsTotal,
      totalDeliveries: delivered.length,
      onTimeRate,
      onTimeSample: onTimeEligible.length,
      days: Array.from(buckets.values()),
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Driver" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-z-sub mb-3">
          <FiChevronLeft size={16} /> Back
        </button>
        <p className="kicker mb-1">Earnings</p>
        <h1 className="display text-2xl text-z-ink mb-6">Your earnings & performance</h1>

        {error && <p className="text-sm text-z-danger">{error}</p>}
        {!stats ? (
          <p className="text-sm text-z-sub">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-card p-4 shadow-card bg-z-surface">
                <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                  <FiTrendingUp className="text-z-primary" size={18} />
                </div>
                <p className="display text-2xl text-z-ink">₹{stats.todayEarnings.toFixed(0)}</p>
                <p className="text-z-muted text-xs mt-1">Today's earnings</p>
              </div>
              <div className="rounded-card p-4 shadow-card bg-z-surface">
                <div className="w-10 h-10 rounded-xl bg-z-sage flex items-center justify-center mb-3">
                  <FiPackage className="text-z-primary" size={18} />
                </div>
                <p className="display text-2xl text-z-ink">₹{stats.weekEarnings.toFixed(0)}</p>
                <p className="text-z-muted text-xs mt-1">All-time earnings</p>
              </div>
            </div>

            <CashOutCard />

            <div className="mb-4">
              <EarningsChart days={stats.days} />
            </div>

            <div className="rounded-card p-5 shadow-card bg-z-surface mb-4">
              <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Performance</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="display text-xl text-z-ink">{stats.totalDeliveries}</p>
                  <p className="text-z-muted text-xs mt-1">Completed deliveries</p>
                </div>
                <div>
                  <p className="display text-xl text-z-ink">₹{stats.tipsTotal.toFixed(0)}</p>
                  <p className="text-z-muted text-xs mt-1">Tips from customers</p>
                </div>
                <div>
                  <p className="display text-xl text-z-ink">
                    {stats.onTimeRate === null ? "—" : `${stats.onTimeRate}%`}
                  </p>
                  <p className="text-z-muted text-xs mt-1">
                    {stats.onTimeRate === null ? "Not enough data yet" : "On-time rate"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Delivery history</p>
            <div className="space-y-3">
              {history.length === 0 && (
                <p className="rounded-card bg-z-surface p-8 text-center text-sm text-z-sub shadow-card">
                  No deliveries yet.
                </p>
              )}
              {history.map((o) => (
                <div key={o.id} className="rounded-card p-4 shadow-card bg-z-surface flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase truncate">
                      {o.restaurant?.name} · #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-sm font-bold text-z-ink truncate">
                      {o.address?.street || "—"}, {o.address?.city || ""}
                    </p>
                    <p className="text-xs text-z-sub flex items-center gap-1 mt-0.5">
                      <FiClock size={11} />
                      {formatWhen(o.createdAt)} ·{" "}
                      <span className={o.status === "CANCELLED" ? "text-z-danger" : "text-z-primary"}>
                        {statusLabel(o.status)}
                      </span>
                    </p>
                    {(Number(o.tip) > 0 || Number(o.postDeliveryTip) > 0) && (
                      <p className="text-xs font-bold text-z-primary mt-0.5">
                        Tip ₹{Math.round(Number(o.tip || 0) + Number(o.postDeliveryTip || 0))}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-z-ink shrink-0">₹{(o.deliveryFee ?? o.total).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
