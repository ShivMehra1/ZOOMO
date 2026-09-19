import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronLeft } from "react-icons/fi";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const FAQS = [
  {
    q: "When do I get paid?",
    a: "Earnings from completed deliveries are settled weekly. You can track running totals any time on the Earnings page.",
  },
  {
    q: "The customer isn't answering the door. What do I do?",
    a: "Call the customer from the order screen. If there's no response after a few minutes, follow the drop-off preference on the order (e.g. leave at door) and add a note, or contact support if you're unsure.",
  },
  {
    q: "How is my rating calculated?",
    a: "Your rating is the average of customer ratings across your recent deliveries. Consistently on-time, careful deliveries keep it high.",
  },
  {
    q: "Can I change my vehicle details?",
    a: "Yes — update your vehicle type and plate number any time from your Profile page.",
  },
  {
    q: "What if an order is missing items?",
    a: "That's on the restaurant, not you — let the customer know at the door and it'll be handled by support/refund on their end.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card bg-z-surface shadow-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-bold text-z-ink">{q}</span>
        <FiChevronDown className={`text-z-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} size={16} />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-z-sub">{a}</p>}
    </div>
  );
}

export default function Support() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  // UI-only for now — no backend support-ticket endpoint exists yet.
  // Wire this to a real POST /driver/support-tickets (or similar) once one exists.
  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;
    setSent(true);
    setSubject("");
    setDetails("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Driver" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-z-sub mb-3">
          <FiChevronLeft size={16} /> Back
        </button>
        <p className="kicker mb-1">Support</p>
        <h1 className="display text-2xl text-z-ink mb-6">Help & support</h1>

        <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Frequently asked</p>
        <div className="space-y-2 mb-6">
          {FAQS.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>

        <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase mb-3">Report an issue</p>
        <form onSubmit={submit} className="rounded-card p-5 shadow-card bg-z-surface space-y-3">
          {sent && (
            <p className="rounded-xl bg-z-sage px-3 py-2 text-[13px] font-bold text-z-primary">
              Thanks — we've received your report and will follow up.
            </p>
          )}
          <div>
            <label className="text-xs font-semibold text-z-sub">Subject</label>
            <input className="field mt-1" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Issue with a delivery" />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-sub">Details</label>
            <textarea
              className="field mt-1 h-28 py-3"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us what happened..."
            />
          </div>
          <button className="btn-primary h-12 w-full" type="submit">
            Submit report
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
