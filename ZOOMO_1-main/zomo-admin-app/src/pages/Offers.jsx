import { useEffect, useState } from "react";
import { createPromotion, deletePromotion, getPromotions, getRestaurants, updatePromotion } from "../services/adminApi";
import { useConfirm } from "../context/ConfirmContext";
import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function Offers() {
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ code: "", description: "", discountType: "PERCENT", value: 10, restaurantId: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, r] = await Promise.all([getPromotions(), getRestaurants().catch(() => ({ data: [] }))]);
    setRows(p.data || []);
    setRestaurants(r.data || []);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createPromotion({ ...form, restaurantId: form.restaurantId || null, value: Number(form.value) });
      setForm({ code: "", description: "", discountType: "PERCENT", value: 10, restaurantId: "" });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Could not create offer");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    const ok = await confirm({ title: "Delete this offer?", body: "Customers will no longer be able to use this code.", confirmLabel: "Delete offer" });
    if (!ok) return;
    await deletePromotion(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-z-ink">Offers</h2>
        <p className="text-z-muted text-sm mt-1">Platform and restaurant promo codes</p>
      </div>

      <form onSubmit={add} className="card grid gap-3 md:grid-cols-5">
        <input className="field" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <input className="field md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="field" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
          <option value="PERCENT">Percent</option>
          <option value="FLAT">Flat ₹</option>
          <option value="FREE_DELIVERY">Free delivery</option>
        </select>
        <input className="field" type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <select className="field md:col-span-2" value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}>
          <option value="">All Jourian restaurants</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button type="submit" disabled={busy} className="btn-primary md:col-span-3"><FiPlus /> {busy ? "Saving…" : "Add offer"}</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-z-line bg-z-page">
              <th className="px-5 py-3 text-z-muted font-medium">Code</th>
              <th className="px-5 py-3 text-z-muted font-medium">Restaurant</th>
              <th className="px-5 py-3 text-z-muted font-medium">Type</th>
              <th className="px-5 py-3 text-z-muted font-medium">Value</th>
              <th className="px-5 py-3 text-z-muted font-medium">Active</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-z-line-soft">
                <td className="px-5 py-3 font-bold text-z-ink">{p.code}</td>
                <td className="px-5 py-3 text-z-sub">{p.restaurant?.name || "All restaurants"}</td>
                <td className="px-5 py-3 text-z-sub">{p.discountType}</td>
                <td className="px-5 py-3 text-z-sub">{p.discountType === "PERCENT" ? `${p.value}%` : p.discountType === "FLAT" ? `₹${p.value}` : "Free delivery"}</td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => updatePromotion(p.id, { isActive: !p.isActive }).then(load)}
                    className={`text-xs font-semibold ${p.isActive ? "text-z-primary" : "text-z-muted"}`}
                  >
                    {p.isActive ? "On" : "Off"}
                  </button>
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => remove(p.id)} className="text-z-danger"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-z-muted">No offers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
