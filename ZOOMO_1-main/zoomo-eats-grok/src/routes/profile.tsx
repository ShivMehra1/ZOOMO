import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Camera, Heart, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { IMG, RESTAURANTS, inr, liveStatus } from "@/lib/zoomo-data";
import { formatWhen } from "@/lib/when";
import { stampCount, useZoomo } from "@/lib/zoomo-store";
import { GreenSwitch } from "@/components/zoomo/switch";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const nav = useNavigate();
  const {
    user,
    updateUser,
    logout,
    addresses,
    saveAddress,
    updateAddress,
    removeAddress,
    favorites,
    visits,
    orders,
    uploadAvatar,
    hydrated,
    location,
    captureLiveLocation,
  } = useZoomo();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });

  useEffect(() => {
    if (hydrated && !user) nav({ to: "/login" });
  }, [hydrated, user, nav]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    const jump = () => {
      const id = window.location.hash.replace("#", "");
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = setTimeout(jump, 80);
    window.addEventListener("hashchange", jump);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", jump);
    };
  }, []);

  const savedList = RESTAURANTS.filter((r) => favorites.includes(r.id));
  const recent = orders.slice(0, 5);
  const spend = useMemo(() => orders.reduce((s, o) => s + (o.total || 0), 0), [orders]);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function saveProfile() {
    updateUser({ name: name.trim() || user?.name, phone: phone.trim() });
    flash();
  }

  async function submitAddr() {
    if (!form.street || !form.city || !form.state || !form.zipCode) return alert("Fill the full address");
    if (editId) updateAddress(editId, form);
    else await saveAddress(form);
    setAdding(false);
    setEditId(null);
    setForm({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });
    flash();
  }

  if (!hydrated || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[640px] px-5 py-6 pb-28">
        <BackBar title="Profile" to="/" />

        <section className="mb-5 overflow-hidden rounded-[28px] bg-primary p-5 text-white shadow-lift">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-white/15 text-2xl font-bold">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  (user.name || "?")[0]?.toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full bg-white text-primary shadow-sm"
                aria-label="Change photo"
              >
                <Camera className="size-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    await uploadAvatar(file);
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-bold tracking-tight">{user.name}</p>
              <p className="truncate text-[13px] text-white/70">{uploading ? "Uploading…" : user.email}</p>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-white/60">
                <MapPin className="size-3" /> {location || "Jourian"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              [String(orders.length), "Orders"],
              [String(savedList.length), "Saved"],
              [inr(spend), "Spent"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 px-3 py-3 text-center">
                <p className="text-[15px] font-bold tabular">{n}</p>
                <p className="text-[10px] font-bold tracking-wide text-white/55 uppercase">{l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Account</h2>
            {saved && <span className="text-[12px] font-bold text-accent">Saved</span>}
          </div>
          <label className="mb-3 block text-[12px] font-bold text-muted">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink" />
          </label>
          <label className="mb-3 block text-[12px] font-bold text-muted">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="mt-1 h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink" />
          </label>
          <p className="mb-3 text-[12px] text-muted">{user.email}</p>
          <button type="button" onClick={saveProfile} className="btn-primary w-full py-2.5 text-sm">
            Save
          </button>
        </section>

        <section className="mb-4 rounded-[24px] bg-surface p-2 shadow-card">
          <PrefRow
            label="Veg only"
            hint="Hide non-veg dishes"
            on={user.vegOnly}
            onToggle={() => updateUser({ vegOnly: !user.vegOnly })}
          />
          <PrefRow
            label="Order alerts"
            hint="Status updates on this bag"
            on={user.notifyOrders !== false}
            onToggle={() => updateUser({ notifyOrders: !user.notifyOrders })}
            icon={<Bell className="size-4" />}
          />
          <div className="flex items-center justify-between rounded-2xl px-3 py-3">
            <div>
              <p className="text-sm font-bold text-ink">Pay with</p>
              <p className="text-[12px] text-muted">Used at checkout</p>
            </div>
            <div className="flex gap-1 rounded-full bg-page p-1">
              {["UPI", "COD"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateUser({ paymentPref: p })}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${user.paymentPref === p ? "bg-primary text-white" : "text-sub"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="addresses" className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Addresses</h2>
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setEditId(null);
                setForm({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });
              }}
              className="flex items-center gap-1 text-[13px] font-bold text-primary"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          <button
            type="button"
            disabled={geoBusy}
            onClick={async () => {
              setGeoBusy(true);
              await captureLiveLocation();
              setGeoBusy(false);
              flash();
            }}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary bg-sage py-2.5 text-[13px] font-bold text-primary"
          >
            <MapPin className="size-4" /> {geoBusy ? "Finding you…" : "Use current location"}
          </button>
          {addresses.length === 0 && !adding && (
            <p className="text-sm text-sub">No saved drop-offs yet.</p>
          )}
          {addresses.map((a) => (
            <div key={a.id} className="mb-2 flex items-start gap-3 rounded-2xl bg-page px-3 py-3">
              <MapPin className="mt-0.5 size-4 text-accent" />
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-ink">
                {a.street}, {a.city}, {a.state} {a.zipCode}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditId(a.id);
                  setForm({ street: a.street, city: a.city, state: a.state, zipCode: a.zipCode });
                  setAdding(true);
                }}
                aria-label="Edit"
              >
                <Pencil className="size-4 text-muted" />
              </button>
              <button type="button" onClick={() => removeAddress(a.id)} aria-label="Remove">
                <Trash2 className="size-4 text-muted" />
              </button>
            </div>
          ))}
          {adding && (
            <div className="mt-3 space-y-2">
              {(["street", "city", "state", "zipCode"] as const).map((k) => (
                <input
                  key={k}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  placeholder={k === "zipCode" ? "PIN" : k}
                  className="h-11 w-full rounded-xl border border-line bg-page px-3 text-sm"
                />
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={submitAddr} className="rounded-xl bg-primary px-4 py-2 text-[13px] font-bold text-white">
                  {editId ? "Update" : "Save"}
                </button>
                <button type="button" onClick={() => { setAdding(false); setEditId(null); }} className="text-[13px] text-sub">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section id="saved" className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <h3 className="mb-3 text-[15px] font-bold text-ink">Saved restaurants</h3>
          {savedList.length === 0 ? (
            <p className="text-sm text-sub">Tap the heart on a restaurant to keep it here.</p>
          ) : (
            <div className="space-y-2">
              {savedList.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-page px-3 py-2.5 text-left"
                >
                  <FoodImg src={r.imageUrl || IMG.restaurantFallback} alt="" className="size-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.cuisineType} · {stampCount(visits, r.id)} orders</p>
                  </div>
                  <Heart className="size-4 fill-primary text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">Recent orders</h3>
            {orders.length > 0 && (
              <button type="button" onClick={() => nav({ to: "/orders" })} className="text-[13px] font-bold text-primary">
                See all
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-sub">Nothing yet. Your bags will land here.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => nav({ to: "/orders/$id", params: { id: o.id } })}
                  className="flex w-full items-center justify-between rounded-2xl bg-page px-3 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{o.restaurantName}</p>
                    <p className="text-[11px] text-muted">{liveStatus(o)} · {formatWhen(o.createdAt)}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-bold tabular">{inr(o.total)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => {
            logout();
            nav({ to: "/" });
          }}
          className="w-full rounded-2xl bg-danger/10 py-3.5 text-sm font-bold text-danger"
        >
          Log out
        </button>
      </main>
    </AppShell>
  );
}

function PrefRow({
  label,
  hint,
  on,
  onToggle,
  icon,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <GreenSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  );
}
