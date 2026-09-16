import { useEffect, useState } from "react";
import { getDisputes, refundOrder } from "../services/adminApi";
import { FiRefreshCw, FiAlertTriangle, FiMessageSquare, FiDollarSign } from "react-icons/fi";

function RefundModal({ order, onClose, onRefunded }) {
  const [amount, setAmount] = useState(order.total);
  const [reason, setReason] = useState(order.cancelReason || "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    try {
      setBusy(true);
      await refundOrder(order.id, Number(amount), reason);
      onRefunded();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to process refund");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-z-surface w-full max-w-md rounded-card p-6 space-y-4 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold text-z-ink">Issue Refund</h3>
        <p className="text-z-muted text-sm">Order #{order.id.slice(0, 8)} · {order.restaurant?.name} · {order.user?.name}</p>

        <div className="space-y-1.5">
          <label className="text-sm text-z-sub font-medium">Refund amount (max ₹{order.total})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={order.total}
            min={0}
            step="0.01"
            className="w-full px-4 py-2.5 rounded-xl border border-z-line bg-z-page text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-z-sub font-medium">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-z-line bg-z-page text-sm text-z-ink focus:outline-none focus:ring-2 focus:ring-z-accent/40 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-z-sub hover:text-z-ink">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !amount || amount <= 0}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-z-primary text-white hover:bg-z-hover disabled:opacity-50"
          >
            {busy ? "Processing..." : "Confirm Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Disputes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState(null);

  async function fetchDisputes() {
    try {
      setLoading(true);
      const res = await getDisputes();
      setOrders(res.data);
    } catch {
      alert("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDisputes(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-z-ink">Disputes & Refunds</h2>
          <p className="text-z-muted text-sm mt-1">Cancelled orders and low-rated deliveries</p>
        </div>
        <button onClick={fetchDisputes} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-z-surface border border-z-line text-z-sub hover:text-z-primary hover:border-z-primary transition text-sm">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && <p className="text-z-muted text-sm text-center py-12">Loading...</p>}
      {!loading && orders.length === 0 && (
        <div className="bg-z-surface border border-z-line rounded-card p-12 text-center">
          <p className="text-z-muted text-sm">No disputes right now — nothing cancelled or rated below 3 stars.</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FiAlertTriangle className={o.status === "CANCELLED" ? "text-z-danger" : "text-amber-500"} size={15} />
                  <p className="text-z-ink font-semibold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    o.status === "CANCELLED" ? "bg-red-50 text-z-danger border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {o.status === "CANCELLED" ? "Cancelled" : `${o.rating}★ rating`}
                  </span>
                  {o.refundedAt && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      Refunded ₹{o.refundAmount?.toFixed(0)}
                    </span>
                  )}
                </div>
                <p className="text-z-sub text-sm">{o.restaurant?.name} · {o.user?.name} ({o.user?.email})</p>
                <p className="text-z-muted text-xs mt-0.5">
                  ₹{o.total.toFixed(0)} · {new Date(o.createdAt).toLocaleString()}
                </p>
                {o.cancelReason && <p className="text-z-sub text-xs mt-1">Reason: {o.cancelReason}</p>}
              </div>

              {!o.refundedAt && (
                <button
                  onClick={() => setRefundTarget(o)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-z-primary hover:bg-z-hover text-white text-xs font-semibold transition"
                >
                  <FiDollarSign size={14} /> Issue Refund
                </button>
              )}
            </div>

            {o.messages?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-z-line-soft space-y-1.5">
                <p className="text-z-muted text-xs flex items-center gap-1.5 mb-1.5">
                  <FiMessageSquare size={12} /> Order chat ({o.messages.length})
                </p>
                {o.messages.slice(0, 3).map((m) => (
                  <p key={m.id} className="text-z-sub text-xs">
                    <span className="font-medium">{m.sender === "CUSTOMER" ? "Customer" : "Driver"}:</span> {m.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {refundTarget && (
        <RefundModal
          order={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={fetchDisputes}
        />
      )}
    </div>
  );
}
