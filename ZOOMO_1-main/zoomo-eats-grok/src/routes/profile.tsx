import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, ChevronRight, Heart, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/zoomo/shell";
import { BackBar } from "@/components/zoomo/back-bar";
import { FoodImg } from "@/components/zoomo/food-img";
import { IMG, RESTAURANTS, inr, liveStatus } from "@/lib/zoomo-data";
import { formatWhen } from "@/lib/when";
import { stampCount, useZoomo } from "@/lib/zoomo-store";
import { GreenSwitch } from "@/components/zoomo/switch";
import { Avatar } from "@/components/zoomo/avatar";

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
    if (!form.street || !form.city || !form.state || !form.zipCode) return;
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

        <section className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar url={user.avatarUrl} name={user.name} className="size-24 text-[28px] ring-4 ring-sage shadow-card" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white"
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
          <p className="text-[11px] font-bold tracking-[0.14em] text-accent uppercase">Zoomo Eats</p>
          <h2 className="mt-1 text-[22px] font-bold tracking-tight text-ink">{user.name}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{uploading ? "Uploading…" : user.email}</p>
          <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
            <MapPin className="size-3" /> {location || "Jourian"}
          </p>
        </section>

        <div className="mb-6 grid grid-cols-3 divide-x divide-line-soft">
          {[
            [String(orders.length), "Orders"],
            [String(savedList.length), "Saved"],
            [inr(spend), "Spent"],
          ].map(([n, l]) => (
            <div key={l} className="px-2 text-center">
              <p className="text-[17px] font-bold tabular text-primary">{n}</p>
              <p className="mt-0.5 text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>

        <Group title="Account" extra={saved ? "Saved" : undefined}>
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Phone" value={phone} onChange={setPhone} tel />
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[13px] text-muted">Email</span>
            <span className="max-w-[60%] truncate text-[13px] text-ink">{user.email}</span>
          </div>
          <div className="px-4 py-3">
            <button type="button" onClick={saveProfile} className="text-[13px] font-bold text-primary">
              Save details
            </button>
          </div>
        </Group>

        <Group title="Preferences">
          <PrefRow label="Veg only" hint="Hide non-veg dishes" on={user.vegOnly} onToggle={() => updateUser({ vegOnly: !user.vegOnly })} />
          <PrefRow
            label="Order alerts"
            hint="Status updates on this bag"
            on={user.notifyOrders !== false}
            onToggle={() => updateUser({ notifyOrders: !user.notifyOrders })}
          />
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-[15px] font-semibold text-ink">Pay with</p>
              <p className="text-[12px] text-muted">Used at checkout</p>
            </div>
            <div className="flex gap-4 text-[13px] font-semibold">
              {["UPI", "COD"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateUser({ paymentPref: p })}
                  className={user.paymentPref === p ? "text-primary" : "text-muted"}
                >
                  {p === "COD" ? "Cash" : "UPI"}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group
          id="addresses"
          title="Addresses"
          extra={
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setEditId(null);
                setForm({ street: "", city: "Jourian", state: "Jammu", zipCode: "" });
              }}
              className="flex items-center gap-1 text-[13px] font-semibold text-primary"
            >
              <Plus className="size-3.5" /> Add
            </button>
          }
        >
          <button
            type="button"
            disabled={geoBusy}
            onClick={async () => {
              setGeoBusy(true);
              await captureLiveLocation();
              setGeoBusy(false);
              flash();
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
              <MapPin className="size-4" />
            </span>
            <span className="flex-1 text-[15px] font-semibold text-ink">{geoBusy ? "Finding you…" : "Use current location"}</span>
            <ChevronRight className="size-4 text-primary/40" />
          </button>
          {addresses.length === 0 && !adding && (
            <p className="px-4 py-3 text-[13px] text-muted">No saved drop-offs yet.</p>
          )}
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
                <MapPin className="size-4" />
              </span>
              <p className="min-w-0 flex-1 text-[14px] leading-5 text-ink">
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
            <div className="space-y-2 px-4 pb-4">
              {(["street", "city", "state", "zipCode"] as const).map((k) => (
                <input
                  key={k}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  placeholder={k === "zipCode" ? "PIN" : k}
                  className="h-11 w-full rounded-xl border border-line bg-page px-3 text-sm"
                />
              ))}
              <div className="flex gap-4 pt-1">
                <button type="button" onClick={submitAddr} className="text-[13px] font-bold text-primary">
                  {editId ? "Update" : "Save address"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setEditId(null);
                  }}
                  className="text-[13px] text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Group>

        <Group id="saved" title="Saved restaurants">
          {savedList.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-muted">Tap the heart on a restaurant to keep it here.</p>
          ) : (
            savedList.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => nav({ to: "/restaurant/$id", params: { id: r.id } })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <FoodImg src={r.imageUrl || IMG.restaurantFallback} alt="" className="size-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{r.name}</p>
                  <p className="text-[12px] text-muted">
                    {r.cuisineType} · {stampCount(visits, r.id)} orders
                  </p>
                </div>
                <Heart className="size-4 fill-primary text-primary" />
              </button>
            ))
          )}
        </Group>

        <Group
          title="Recent orders"
          extra={
            orders.length > 0 ? (
              <button type="button" onClick={() => nav({ to: "/orders" })} className="text-[13px] font-semibold text-primary">
                See all
              </button>
            ) : undefined
          }
        >
          {recent.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-muted">Nothing yet. Your orders will land here.</p>
          ) : (
            recent.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => nav({ to: "/orders/$id", params: { id: o.id } })}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{o.restaurantName}</p>
                  <p className="text-[12px] text-muted">
                    {liveStatus(o)} · {formatWhen(o.createdAt)}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-[15px] font-semibold tabular text-ink">{inr(o.total)}</span>
              </button>
            ))
          )}
        </Group>

        <button
          type="button"
          onClick={() => {
            logout();
            nav({ to: "/" });
          }}
          className="mt-2 w-full py-4 text-center text-[15px] font-semibold text-danger"
        >
          Log out
        </button>
      </main>
    </AppShell>
  );
}

function Group({
  id,
  title,
  extra,
  children,
}: {
  id?: string;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-6">
      <div className="mb-2 flex items-end justify-between px-1">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{title}</h3>
        {extra ? <span className="text-[12px] font-bold text-accent">{extra}</span> : null}
      </div>
      <div className="divide-y divide-line-soft overflow-hidden rounded-[20px] bg-white shadow-card">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  tel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tel?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="shrink-0 text-[13px] text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={tel ? "tel" : undefined}
        className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-ink outline-none"
      />
    </label>
  );
}

function PrefRow({ label, hint, on, onToggle }: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <GreenSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  );
}
