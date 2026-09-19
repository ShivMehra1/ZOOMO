import { useEffect, useState } from "react";
import { createPromotion, deletePromotion, getPromotions, getRainSurge, getRestaurants, setRainSurge, updatePromotion } from "../services/adminApi";
import { useConfirm } from "../context/ConfirmContext";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import GreenSwitch from "../components/GreenSwitch";

export default function Offers() {
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ code: "", description: "", discountType: "PERCENT", value: 10, restaurantId: "", showOnCard: false, badgeLabel: "" });
  const [busy, setBusy] = useState(false);
  const [rain, setRain] = useState(false);
  const [rainPct, setRainPct] = useState(25);
  const [editId, setEditId] = useState(null);

  async function load() {
    const [p, r, s] = await Promise.all([
      getPromotions(),
      getRestaurants().catch(() => ({ data: [] })),
      getRainSurge().catch(() => ({ data: { rainSurge: false } })),
    ]);
    setRows(p.data || []);
    setRestaurants(r.data || []);
    setRain(Boolean(s.data?.rainSurge));
    if (s.data?.pct) setRainPct(s.data.pct);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        restaurantId: form.restaurantId || null,
        value: Number(form.value),
        showOnCard: Boolean(form.showOnCard && form.restaurantId),
        badgeLabel: form.badgeLabel || form.code,
      };
      if (editId) await updatePromotion(editId, payload);
      else await createPromotion(payload);
      setEditId(null);
      setForm({ code: "", description: "", discountType: "PERCENT", value: 10, restaurantId: "", showOnCard: false, badgeLabel: "" });
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
        <p className="text-z-muted text-sm mt-1">Restaurant badges, promo codes, and rain surge</p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-z-ink">Rain surge</p>
          <p className="text-sm text-z-muted">Hikes delivery fee by the percent you set. Banner shows on customer home.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min="5"
            max="100"
            className="field w-24"
            value={rainPct}
            onChange={(e) => setRainPct(Number(e.target.value))}
            onBlur={async () => {
              const res = await setRainSurge(rain, rainPct);
              setRain(Boolean(res.data?.rainSurge ?? rain));
              if (res.data?.pct) setRainPct(res.data.pct);
            }}
          />
          <span className="text-sm text-z-muted">% hike</span>
          <GreenSwitch
            on={rain}
            caption="Active"
            label="Rain surge"
            onToggle={async () => {
              const next = !rain;
              const res = await setRainSurge(next, rainPct);
              setRain(Boolean(res.data?.rainSurge ?? next));
              if (res.data?.pct) setRainPct(res.data.pct);
            }}
          />
        </div>
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
        <input className="field" placeholder="Badge on card (e.g. 20% OFF)" value={form.badgeLabel} onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })} />
        <label className="flex items-center gap-3 text-sm text-z-ink md:col-span-2">
          <GreenSwitch
            on={form.showOnCard}
            disabled={!form.restaurantId}
            label="Show on restaurant card"
            onToggle={() => setForm({ ...form, showOnCard: !form.showOnCard })}
          />
          Show on that restaurant’s thumbnail
        </label>
        <button type="submit" disabled={busy} className="btn-primary md:col-span-2"><FiPlus /> {busy ? "Saving…" : editId ? "Save offer" : "Add offer"}</button>
        {editId && (
          <button
            type="button"
            className="btn-ghost md:col-span-1"
            onClick={() => {
              setEditId(null);
              setForm({ code: "", description: "", discountType: "PERCENT", value: 10, restaurantId: "", showOnCard: false, badgeLabel: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-z-line bg-z-page">
              <th className="px-5 py-3 text-z-muted font-medium">Code</th>
              <th className="px-5 py-3 text-z-muted font-medium">Restaurant</th>
              <th className="px-5 py-3 text-z-muted font-medium">Type</th>
              <th className="px-5 py-3 text-z-muted font-medium">Value</th>
              <th className="px-5 py-3 text-z-muted font-medium">Card badge</th>
              <th className="px-5 py-3 text-z-muted font-medium">Active</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-t border-z-line-soft cursor-pointer hover:bg-z-page"
                onClick={() => {
                  setEditId(p.id);
                  setForm({
                    code: p.code,
                    description: p.description || "",
                    discountType: p.discountType,
                    value: p.value,
                    restaurantId: p.restaurantId || "",
                    showOnCard: Boolean(p.showOnCard),
                    badgeLabel: p.badgeLabel || "",
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <td className="px-5 py-3 font-bold text-z-ink">{p.code}</td>
                <td className="px-5 py-3 text-z-sub">{p.restaurant?.name || "All restaurants"}</td>
                <td className="px-5 py-3 text-z-sub">{p.discountType}</td>
                <td className="px-5 py-3 text-z-sub">{p.discountType === "PERCENT" ? `${p.value}%` : p.discountType === "FLAT" ? `₹${p.value}` : "Free delivery"}</td>
                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  {p.restaurantId ? (
                    <div className="flex items-center gap-2">
                      <GreenSwitch
                        on={Boolean(p.showOnCard)}
                        label="Card badge"
                        onToggle={() => updatePromotion(p.id, { showOnCard: !p.showOnCard }).then(load)}
                      />
                      <span className="text-xs text-z-sub">{p.badgeLabel || p.code}</span>
                    </div>
                  ) : (
                    <span className="text-z-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <GreenSwitch
                    on={Boolean(p.isActive)}
                    caption="Active"
                    label="Offer active"
                    onToggle={() => updatePromotion(p.id, { isActive: !p.isActive }).then(load)}
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="text-z-danger"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-z-muted">No offers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
