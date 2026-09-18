import { useState } from "react";
import { FiX } from "react-icons/fi";

const FORMS = {
  user: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone" },
    { key: "password", label: "Password", type: "password" },
    { key: "role", label: "Role", select: ["USER", "MERCHANT", "DRIVER", "ADMIN"] },
  ],
  driver: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone" },
    { key: "password", label: "Password", type: "password" },
    { key: "vehicleType", label: "Vehicle" },
    { key: "vehiclePlate", label: "Plate" },
  ],
  restaurant: [
    { key: "name", label: "Restaurant name", required: true },
    { key: "address", label: "Address", required: true },
    { key: "cuisineType", label: "Cuisine" },
    { key: "phone", label: "Phone" },
    { key: "ownerEmail", label: "Owner email", type: "email", required: true },
    { key: "ownerName", label: "Owner name" },
  ],
};

export default function CreateSheet({ kind, title, onClose, onSubmit }) {
  const fields = FORMS[kind] || FORMS.user;
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-z-ink/40 sm:items-center">
      <form onSubmit={submit} className="w-full max-w-lg rounded-t-card sm:rounded-card bg-z-surface p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-z-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-z-muted hover:text-z-ink"><FiX size={18} /></button>
        </div>
        {error && <p className="mb-3 text-sm text-z-danger">{error}</p>}
        <div className="grid gap-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs font-medium text-z-sub">{f.label}</span>
              {f.select ? (
                <select
                  className="field"
                  value={form[f.key] || f.select[0]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                >
                  {f.select.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  className="field"
                  type={f.type || "text"}
                  required={f.required}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
          {busy ? "Saving…" : "Create"}
        </button>
      </form>
    </div>
  );
}
