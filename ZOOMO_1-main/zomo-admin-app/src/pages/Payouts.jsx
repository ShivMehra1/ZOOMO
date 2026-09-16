import { useEffect, useState } from "react";
import { getPayouts, approvePayout, rejectPayout } from "../services/adminApi";
import { getAdminSocket } from "../lib/socket";
import { FiCheck, FiX, FiClock } from "react-icons/fi";

const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-z-sage text-z-primary border-z-accent/20",
  REJECTED: "bg-red-50 text-z-danger border-red-200",
};

function recipientName(p) {
  if (p.recipientType === "RESTAURANT") return p.restaurant?.name || "Restaurant";
  return p.driver?.user?.name || "Driver";
}

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function fetchPayouts() {
    try {
      const res = await getPayouts();
      setPayouts(res.data);
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
    setBusyId(id);
    try {
      if (action === "approve") await approvePayout(id);
      else await rejectPayout(id);
      await fetchPayouts();
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="text-z-muted text-sm py-12 text-center">Loading payouts...</div>;
  }

  const pending = payouts.filter((p) => p.status === "PENDING");
  const resolved = payouts.filter((p) => p.status !== "PENDING");

  return (
    <div className="space-y-6">
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
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-z-line bg-z-page">
                <div>
                  <p className="text-z-ink font-medium">
                    {recipientName(p)}{" "}
                    <span className="text-z-muted text-xs font-normal">· {p.recipientType === "RESTAURANT" ? "Restaurant" : "Driver"}</span>
                  </p>
                  <p className="text-z-sub text-sm mt-0.5">
                    ₹{p.amount.toFixed(2)} via {p.method.replace("_", " ")}
                    {p.payoutDetail ? ` · ${p.payoutDetail}` : ""}
                  </p>
                  <p className="text-z-muted text-xs mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "reject")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-z-danger border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <FiX size={14} /> Reject
                  </button>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => act(p.id, "approve")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-z-primary text-white hover:bg-z-hover transition disabled:opacity-50 focus:shadow-glow"
                  >
                    <FiCheck size={14} /> {busyId === p.id ? "Working..." : "Approve"}
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
              <div key={p.id} className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-z-page transition">
                <div>
                  <p className="text-z-ink text-sm font-medium">
                    {recipientName(p)} <span className="text-z-muted text-xs font-normal">· ₹{p.amount.toFixed(2)} · {p.method.replace("_", " ")}</span>
                  </p>
                  <p className="text-z-muted text-xs">{new Date(p.createdAt).toLocaleString()}</p>
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
