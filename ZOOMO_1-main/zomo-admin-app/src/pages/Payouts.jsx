import { useEffect, useState } from "react";
import { getPayouts, approvePayout, rejectPayout, markPayoutPaid, uploadImage, uploadPayoutProof } from "../services/adminApi";
import { mediaUrl } from "../lib/media";
import { useConfirm } from "../context/ConfirmContext";
import { getAdminSocket } from "../lib/socket";
import { formatWhen } from "../lib/when";
import { FiCheck, FiX, FiClock, FiImage } from "react-icons/fi";

const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-z-sage text-z-primary border-z-accent/20",
  REJECTED: "bg-red-50 text-z-danger border-red-200",
};

function recipientName(p) {
  if (p.recipientType === "RESTAURANT") return p.restaurant?.name || "Restaurant";
  return p.driver?.user?.name || "Driver";
}

function methodLine(p) {
  const src = p.recipientType === "RESTAURANT" ? p.restaurant : p.driver;
  if (!src) return p.payoutDetail || "";
  if (src.payoutMethod === "UPI" || p.method === "UPI") return `UPI ${src.upiId || p.payoutDetail || ""}`.trim();
  if (src.payoutMethod === "BANK" || p.method === "BANK_TRANSFER") return `Bank ${src.bankName || ""} ${src.accountLast4 ? `••••${src.accountLast4}` : p.payoutDetail || ""}`.trim();
  return `Cash ${p.payoutDetail || ""}`.trim();
}

function ProofBlock({ payout, busy, onReplace, onOpen }) {
  const src = mediaUrl(payout.paymentProofUrl);
  if (!src) {
    return (
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-z-line bg-z-surface px-3 py-2 text-xs font-semibold text-z-sub hover:border-z-primary hover:text-z-primary">
        <FiImage size={14} /> Attach screenshot
        <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && onReplace(payout.id, e.target.files[0])} />
      </label>
    );
  }
  return (
    <div className="mt-3 flex items-start gap-3">
      <button type="button" onClick={() => onOpen(src)} className="block shrink-0">
        <img src={src} alt="Payment proof" className="h-24 w-36 rounded-xl object-cover border border-z-line bg-z-surface" />
      </button>
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-z-ink">Payment screenshot</p>
        <p className="text-[11px] text-z-muted">Visible to the restaurant / driver. Click to enlarge.</p>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-z-primary">
          Replace
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && onReplace(payout.id, e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}

export default function Payouts() {
  const { confirm } = useConfirm();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  function mergePayout(updated) {
    setPayouts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  async function fetchPayouts() {
    try {
      const res = await getPayouts();
      setPayouts(res.data || []);
    } catch {
      // keep last known list on a transient failure
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayouts();
    const socket = getAdminSocket();
    const refresh = () => fetchPayouts();
    socket.on("payout:requested", refresh);
    socket.on("payout:updated", refresh);
    return () => {
      socket.off("payout:requested", refresh);
      socket.off("payout:updated", refresh);
    };
  }, []);

  async function act(id, action) {
    if (action === "reject") {
      const ok = await confirm({ title: "Reject this payout?", body: "The restaurant or driver will see this as rejected.", confirmLabel: "Reject" });
      if (!ok) return;
    }
    setBusyId(id);
    try {
      const req = action === "approve" ? approvePayout(id) : action === "paid" ? markPayoutPaid(id) : rejectPayout(id);
      const res = await req;
      if (res?.data?.id) mergePayout(res.data);
      await fetchPayouts();
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function attachProof(id, file) {
    setBusyId(id);
    try {
      const { url } = await uploadImage(file, "payouts");
      const res = await uploadPayoutProof(id, url);
      const next = res?.data || {};
      mergePayout({ id, paymentProofUrl: next.paymentProofUrl || url, status: next.status, ...next });
    } catch (err) {
      alert(err?.response?.data?.message || "Could not attach screenshot");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="text-z-muted text-sm py-12 text-center">Loading payouts...</div>;
  }

  const pending = payouts.filter((p) => p.status === "PENDING");
  const approved = payouts.filter((p) => p.status === "APPROVED");
  const resolved = payouts.filter((p) => p.status === "COMPLETED" || p.status === "REJECTED");

  return (
    <div className="space-y-6">
      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-z-ink/70 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Payment proof" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-card" />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-z-ink">Payouts</h2>
        <p className="text-z-muted text-sm mt-1">Cash-out requests from restaurants and drivers</p>
      </div>

      <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="text-z-primary" size={16} />
          <h3 className="text-z-ink font-semibold">Pending requests</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-z-sage text-z-primary font-medium">{pending.length}</span>
        </div>

        {pending.length === 0 ? (
          <p className="text-z-muted text-sm">Nothing waiting on approval</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-z-line bg-z-page">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-z-ink font-medium">
                      {recipientName(p)}{" "}
                      <span className="text-z-muted text-xs font-normal">· {p.recipientType === "RESTAURANT" ? "Restaurant" : "Driver"}</span>
                    </p>
                    <p className="text-z-sub text-sm mt-0.5">₹{p.amount.toFixed(2)} · {methodLine(p)}</p>
                    <p className="text-z-muted text-xs mt-1">Requested {formatWhen(p.createdAt)}</p>
                    <p className="text-z-muted text-xs">Approve first. They'll be paid within 24 hours.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button disabled={busyId === p.id} onClick={() => act(p.id, "reject")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-z-danger border border-red-200 hover:bg-red-50 transition disabled:opacity-50">
                      <FiX size={14} /> Reject
                    </button>
                    <button disabled={busyId === p.id} onClick={() => act(p.id, "approve")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-z-primary text-white hover:bg-z-hover transition disabled:opacity-50">
                      <FiCheck size={14} /> {busyId === p.id ? "Working..." : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {approved.length > 0 && (
          <div className="mt-5 space-y-3">
            <h3 className="text-z-ink font-semibold">Approved — pay within 24 hours</h3>
            {approved.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-z-line bg-z-page">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-z-ink font-medium">{recipientName(p)}</p>
                    <p className="text-z-sub text-sm mt-0.5">₹{p.amount.toFixed(2)} · {methodLine(p)}</p>
                    <p className="text-z-muted text-xs mt-1">Requested {formatWhen(p.createdAt)}</p>
                    <ProofBlock payout={p} busy={busyId === p.id} onReplace={attachProof} onOpen={setLightbox} />
                  </div>
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "paid")} className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-z-primary text-white disabled:opacity-50">
                    Mark paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-z-surface border border-z-line rounded-card p-5 shadow-card">
        <h3 className="text-z-ink font-semibold mb-4">History</h3>
        {resolved.length === 0 ? (
          <p className="text-z-muted text-sm">No resolved payouts yet</p>
        ) : (
          <div className="space-y-2">
            {resolved.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 px-2 py-2.5 rounded-xl hover:bg-z-page transition">
                <div className="min-w-0">
                  <p className="text-z-ink text-sm font-medium">
                    {recipientName(p)} <span className="text-z-muted text-xs font-normal">· ₹{p.amount.toFixed(2)} · {p.method.replace("_", " ")}</span>
                  </p>
                  <p className="text-z-muted text-xs">Requested {formatWhen(p.createdAt)}</p>
                  {p.status === "COMPLETED" && <p className="text-z-muted text-xs">Paid {formatWhen(p.updatedAt || p.createdAt)}</p>}
                  {p.paymentProofUrl && (
                    <button type="button" onClick={() => setLightbox(mediaUrl(p.paymentProofUrl))} className="mt-2">
                      <img src={mediaUrl(p.paymentProofUrl)} alt="Payment proof" className="h-20 w-32 rounded-lg object-cover border border-z-line" />
                    </button>
                  )}
                  {p.status === "COMPLETED" && (
                    <label className="mt-1 inline-block text-[11px] font-semibold text-z-primary cursor-pointer">
                      Replace screenshot
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && attachProof(p.id, e.target.files[0])} />
                    </label>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[p.status]}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
