import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Heart, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { RESTAURANTS, inr, liveStatus } from "@/lib/zoomo-data";
import { useGoBack } from "@/lib/zoomo-nav";
import { isRegular, stampCount, useZoomo } from "@/lib/zoomo-store";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const nav = useNavigate();
  const back = useGoBack("/");
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
  } = useZoomo();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    setEmail(user.email);
    setPhone(user.phone);
  }, [user]);

  const regulars = useMemo(
    () => RESTAURANTS.filter((r) => visitsOfSafe(visits, r.id) > 0),
    [visits],
  );
  const savedList = RESTAURANTS.filter((r) => favorites.includes(r.id));
  const recent = orders.slice(0, 5);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function saveProfile() {
    updateUser({ name: name.trim() || user?.name, email: email.trim() || user?.email, phone: phone.trim() });
    flash();
  }

  function submitAddr() {
    if (!form.street || !form.city || !form.state || !form.zipCode) return alert("Fill the full address");
    if (editId) updateAddress(editId, form);
    else saveAddress(form);
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
      <main className="mx-auto max-w-[640px] px-5 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            className="flex size-10 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="kicker">Account</p>
            <h1 className="display text-[26px] text-ink">Your profile</h1>
          </div>
        </div>

        <section className="mb-4 flex items-center gap-4 rounded-[24px] bg-surface p-5 shadow-card">
          <div className="relative shrink-0">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-sage text-xl font-bold text-primary">
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
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-sm"
              aria-label="Change photo"
            >
              <Camera className="size-3" />
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
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink">{user.name}</p>
            <p className="truncate text-xs text-sub">{uploading ? "Uploading…" : user.email}</p>
          </div>
        </section>

        <section className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Details</h2>
            {saved && <span className="text-[12px] font-bold text-accent">Saved</span>}
          </div>
          <label className="mb-3 block text-[12px] font-bold text-muted">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink" />
          </label>
          <label className="mb-3 block text-[12px] font-bold text-muted">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink" />
          </label>
          <label className="mb-3 block text-[12px] font-bold text-muted">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink" />
          </label>
          <button type="button" onClick={saveProfile} className="btn-primary mt-1 w-full py-2.5 text-sm">
            Save details
          </button>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-page px-4 py-3">
            <span className="text-sm font-bold text-ink">Veg only</span>
            <button
              type="button"
              onClick={() => updateUser({ vegOnly: !user.vegOnly })}
              className={`relative h-6 w-11 rounded-full ${user.vegOnly ? "bg-primary" : "bg-line-soft"}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${user.vegOnly ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
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
          {addresses.map((a) => (
            <div key={a.id} className="mb-2 flex items-start gap-3 rounded-2xl border border-line px-3 py-3">
              <MapPin className="mt-0.5 size-4 text-accent" />
              <p className="min-w-0 flex-1 text-[13px] text-ink">
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

        <section className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <h3 className="mb-1 text-[15px] font-bold tracking-tight text-ink">Your restaurants</h3>
          {regulars.length === 0 ? (
            <p className="text-sm text-sub">No bags yet. Order once and the restaurant shows up here.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {regulars.map((r) => {
                const stamps = stampCount(visits, r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
                    className="flex w-full items-center gap-3 rounded-2xl bg-page px-3 py-3 text-left"
                  >
                    <img src={r.imageUrl} alt="" className="size-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                      <p className="text-[11px] text-muted">{isRegular(visits, r.id) ? "Regular" : `${stamps}/5 to a free ride`}</p>
                      <div className="mt-1 flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`size-2 rounded-full ${i < stamps ? "bg-primary" : "bg-line"}`} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section id="saved" className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <h3 className="mb-3 text-[15px] font-bold tracking-tight text-ink">Saved restaurants</h3>
          {savedList.length === 0 ? (
            <p className="text-sm text-sub">Tap the heart on a restaurant to save it here.</p>
          ) : (
            <div className="space-y-2">
              {savedList.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-page px-3 py-3 text-left"
                >
                  <Heart className="size-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-ink">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4 rounded-[24px] bg-surface p-5 shadow-card">
          <h3 className="mb-3 text-[15px] font-bold tracking-tight text-ink">Recent orders</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-sub">Nothing yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => nav({ to: "/orders/$id", params: { id: o.id } })}
                  className="flex w-full items-center justify-between rounded-2xl bg-page px-3 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{o.restaurantName}</p>
                    <p className="text-[11px] text-muted">{liveStatus(o)}</p>
                  </div>
                  <span className="text-sm font-bold tabular">{inr(o.total)}</span>
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
          className="btn-ghost w-full py-3 text-sm text-danger"
        >
          Log out
        </button>
      </main>
    </AppShell>
  );
}

function visitsOfSafe(visits: Record<string, number> | undefined, id: string) {
  return visits?.[id] ?? 0;
}
