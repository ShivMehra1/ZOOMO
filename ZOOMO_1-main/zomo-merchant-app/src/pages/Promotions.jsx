import { useEffect, useState } from "react";
import api from "../services/api";
import { formatWhen } from "../lib/when";

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/merchant/promotions");
      setPromotions(res.data ?? []);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (promo) => {
    setSavingId(promo.id);
    try {
      const res = await api.patch(`/merchant/promotions/${promo.id}`, { isActive: !promo.isActive });
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? res.data : p)));
    } catch {
      // leave list as-is; a retry via toggling again is enough for this pass
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (promo) => {
    setSavingId(promo.id);
    try {
      await api.delete(`/merchant/promotions/${promo.id}`);
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    } catch {
      // no-op — list simply won't update if the delete failed
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading promotions...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker mb-1">Marketing</p>
          <h1 className="display text-2xl text-z-ink">Promotions</h1>
          <p className="text-sm text-z-sub mt-1">Create discount codes customers can apply at checkout</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary h-11 px-5 text-sm shrink-0">
          {showForm ? "Cancel" : "+ New promo"}
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl bg-z-danger/10 border border-z-danger/20 px-4 py-3">
          <p className="text-sm text-z-danger">{loadError}</p>
        </div>
      )}

      {showForm && (
        <PromoForm
          onCreated={(promo) => {
            setPromotions((prev) => [promo, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {promotions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-z-sub">
          No promo codes yet. Create one to bring customers back.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-z-ink tracking-wide">{promo.code}</p>
                  {promo.description && <p className="text-sm text-z-sub mt-0.5">{promo.description}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 ${
                  promo.isActive ? "bg-z-sage text-z-primary" : "bg-z-danger/10 text-z-danger"
                }`}>
                  {promo.isActive ? "Active" : "Paused"}
                </span>
              </div>

              <p className="text-2xl font-bold text-z-ink">
                {promo.discountType === "FLAT" ? `₹${promo.value} off` : `${promo.value}% off`}
              </p>

              <div className="text-xs text-z-muted space-y-0.5">
                {promo.minOrderValue != null && <p>Min order ₹{promo.minOrderValue}</p>}
                {promo.maxDiscount != null && <p>Max discount ₹{promo.maxDiscount}</p>}
                {promo.expiresAt && <p>Expires {formatWhen(promo.expiresAt)}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => toggleActive(promo)}
                  disabled={savingId === promo.id}
                  className="btn-ghost h-10 flex-1 text-sm disabled:opacity-60"
                >
                  {promo.isActive ? "Pause" : "Activate"}
                </button>
                <button
                  onClick={() => remove(promo)}
                  disabled={savingId === promo.id}
                  className="h-10 px-4 rounded-xl text-sm font-bold text-z-danger border border-z-danger/20 hover:bg-z-danger/10 transition disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromoForm({ onCreated }) {
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    value: "",
    maxDiscount: "",
    minOrderValue: "",
    expiresAt: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.code || !form.value) {
      setError("Code and discount value are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/merchant/promotions", {
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create promotion");
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

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-z-ink mb-1">Code *</label>
          <input
            className="field"
            placeholder="WELCOME10"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-z-ink mb-1">Discount type</label>
          <select
            className="field"
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
          >
            <option value="PERCENT">Percent off</option>
            <option value="FLAT">Flat amount off</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-z-ink mb-1">Description</label>
        <input
          className="field"
          placeholder="10% off your first order"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-z-ink mb-1">
            {form.discountType === "FLAT" ? "Amount off (₹) *" : "Percent off (%) *"}
          </label>
          <input
            className="field"
            type="number"
            min="0"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-z-ink mb-1">Max discount (₹)</label>
          <input
            className="field"
            type="number"
            min="0"
            placeholder="Optional"
            value={form.maxDiscount}
            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-z-ink mb-1">Min order (₹)</label>
          <input
            className="field"
            type="number"
            min="0"
            placeholder="Optional"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-z-ink mb-1">Expires on</label>
        <input
          className="field"
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary h-11 w-full disabled:opacity-60">
        {saving ? "Creating..." : "Create promo code"}
      </button>
    </form>
  );
}
