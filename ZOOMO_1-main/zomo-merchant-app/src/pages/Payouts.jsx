import { useEffect, useState } from "react";
import api from "../services/api";
import { socket, joinRoom, leaveRoom } from "../lib/socket";

const METHODS = [
  { id: "UPI", label: "UPI" },
  { id: "BANK_TRANSFER", label: "Bank transfer" },
  { id: "CASH", label: "Cash" },
];

const DETAIL_LABEL = {
  UPI: "UPI ID",
  BANK_TRANSFER: "Bank account (last 4 / IFSC)",
  CASH: "Pickup note (optional)",
};

const STATUS_TONE = {
  PENDING: "tone-wait",
  COMPLETED: "tone-done",
  REJECTED: "tone-stop",
};

export default function Payouts() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  const load = async () => {
    try {
      const [balRes, listRes, meRes] = await Promise.all([
        api.get("/merchant/payouts/balance"),
        api.get("/merchant/payouts"),
        api.get("/merchant/restaurants/me"),
      ]);
      setBalance(balRes.data);
      setHistory(listRes.data ?? []);
      setRestaurantId(meRes.data?.id ?? null);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live updates when admin approves/rejects a request elsewhere.
  useEffect(() => {
    if (!restaurantId) return;
    const room = `restaurant:${restaurantId}`;
    joinRoom(room);

    const onPayoutUpdate = (payout) => {
      setHistory((prev) => {
        const exists = prev.some((p) => p.id === payout.id);
        return exists ? prev.map((p) => (p.id === payout.id ? payout : p)) : [payout, ...prev];
      });
      // Balance shifts whenever a payout resolves — just refetch it.
      api.get("/merchant/payouts/balance").then((r) => setBalance(r.data)).catch(() => {});
    };

    socket.on("payout:updated", onPayoutUpdate);
    return () => {
      socket.off("payout:updated", onPayoutUpdate);
      leaveRoom(room);
    };
  }, [restaurantId]);

  if (loading) return <p className="text-z-sub text-sm py-12 text-center">Loading payouts...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker mb-1">Earnings</p>
          <h1 className="display text-2xl text-z-ink">Cash out</h1>
          <p className="text-sm text-z-sub mt-1">Your 70% share of item sales, available to withdraw any time</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl bg-z-danger/10 border border-z-danger/20 px-4 py-3">
          <p className="text-sm text-z-danger">{loadError}</p>
        </div>
      )}

      {balance && (
        <div className="card p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-z-muted">Available balance</p>
          <p className="display text-4xl text-z-ink mt-1">₹{balance.available.toFixed(2)}</p>
          <div className="flex gap-6 mt-3 text-xs text-z-sub">
            <span>Total earned ₹{balance.earned.toFixed(2)}</span>
            <span>Paid / pending ₹{balance.paidOrPending.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={balance.available <= 0}
            className="btn-primary h-11 px-6 text-sm mt-4 disabled:opacity-50"
          >
            {showForm ? "Cancel" : "Cash out"}
          </button>
        </div>
      )}

      {showForm && balance && (
        <PayoutForm
          available={balance.available}
          onCreated={(payout) => {
            setHistory((prev) => [payout, ...prev]);
            setBalance((b) => ({ ...b, paidOrPending: b.paidOrPending + payout.amount, available: b.available - payout.amount }));
            setShowForm(false);
          }}
        />
      )}

      <div>
        <h2 className="text-sm font-bold text-z-ink mb-3">History</h2>
        {history.length === 0 ? (
          <div className="card p-8 text-center text-sm text-z-sub">No cash-out requests yet.</div>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-z-ink">₹{p.amount.toFixed(2)} · {METHODS.find((m) => m.id === p.method)?.label || p.method}</p>
                  <p className="text-xs text-z-muted mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${STATUS_TONE[p.status] || "tone-wait"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutForm({ available, onCreated }) {
  const [method, setMethod] = useState("UPI");
  const [amount, setAmount] = useState("");
  const [payoutDetail, setPayoutDetail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (amt > available) return setError(`Amount exceeds your available balance (₹${available.toFixed(2)}).`);

    setSaving(true);
    try {
      const res = await api.post("/merchant/payouts", { amount: amt, method, payoutDetail: payoutDetail || undefined });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request cash out");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      {error && (
        <div className="rounded-xl bg-z-danger/10 border border-z-danger/20 px-4 py-3">
          <p className="text-sm text-z-danger">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-z-sub block mb-1.5">Amount (₹)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Up to ₹${available.toFixed(2)}`}
          className="field"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-z-sub block mb-1.5">Payout method</label>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex-1 h-10 rounded-xl border-[1.5px] text-sm font-bold transition ${
                method === m.id ? "glow-selected" : "border-z-line bg-z-surface text-z-sub"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-z-sub block mb-1.5">{DETAIL_LABEL[method]}</label>
        <input
          value={payoutDetail}
          onChange={(e) => setPayoutDetail(e.target.value)}
          placeholder={method === "UPI" ? "you@upi" : method === "BANK_TRANSFER" ? "HDFC ****1234" : "e.g. pickup Tuesdays"}
          className="field"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary h-11 w-full text-sm disabled:opacity-60">
        {saving ? "Requesting…" : "Request cash out"}
      </button>
    </form>
  );
}
