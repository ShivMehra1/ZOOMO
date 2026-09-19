import { useEffect, useRef, useState } from "react";
import { FiCamera, FiHelpCircle, FiLogOut, FiStar } from "react-icons/fi";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useDriverAuth } from "../context/DriverAuthContext";
import {
  fetchDriverProfile,
  updateDriverAccount,
  updateDriverVehicle,
  uploadDriverAvatar,
} from "../services/driverApi";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { logout } = useDriverAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  useEffect(() => {
    fetchDriverProfile()
      .then((data) => {
        setProfile(data);
        setName(data.user?.name || "");
        setPhone(data.user?.phone || "");
        setVehicleType(data.vehicleType || "");
        setVehiclePlate(data.vehiclePlate || "");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }
    setError("");

    const localPreview = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, user: { ...p.user, avatarUrl: localPreview } }));

    try {
      setUploading(true);
      const { url } = await uploadDriverAvatar(file);
      await updateDriverAccount({ avatarUrl: url });
      setProfile((p) => ({ ...p, user: { ...p.user, avatarUrl: url } }));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateDriverAccount({ name, phone });
      await updateDriverVehicle({ vehicleType, vehiclePlate });
      setProfile((p) => ({
        ...p,
        vehicleType,
        vehiclePlate,
        user: { ...p.user, name, phone },
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-z-page pb-28">
        <Header title="Driver" />
        <p className="text-center text-sm text-z-sub mt-20">Loading profile...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Driver" />
      <div className="mx-auto max-w-xl px-4 py-6">
        {error && (
          <p className="mb-4 rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">{error}</p>
        )}

        <section className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-z-sage text-[28px] font-bold text-z-primary ring-4 ring-white shadow-card"
            >
              {profile?.user?.avatarUrl ? (
                <img src={profile.user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (name || "D").charAt(0).toUpperCase()
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                  Uploading
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-z-primary text-white ring-2 ring-white"
              aria-label="Change photo"
            >
              <FiCamera size={13} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-z-accent uppercase">Zoomo Eats</p>
          <h2 className="mt-1 text-[22px] font-bold tracking-tight text-z-ink">{name || "Driver"}</h2>
          <p className="mt-0.5 text-[13px] text-z-muted">{profile?.user?.email}</p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-z-sage px-2.5 py-1 text-[12px] font-bold text-z-primary">
            <FiStar size={12} /> {profile?.rating ?? "—"} rating
          </p>
        </section>

        <Group title="Personal" extra={saved ? "Saved" : null}>
          <Row label="Name">
            <input className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-z-ink outline-none" value={name} onChange={(e) => setName(e.target.value)} />
          </Row>
          <Row label="Phone">
            <input className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-z-ink outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Row>
          <Row label="Email">
            <span className="max-w-[60%] truncate text-[13px] text-z-ink">{profile?.user?.email || ""}</span>
          </Row>
        </Group>

        <Group title="Vehicle">
          <Row label="Type">
            <input
              className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-z-ink outline-none"
              placeholder="Bike, Scooter, Car"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </Row>
          <Row label="Plate">
            <input className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-z-ink outline-none" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
          </Row>
        </Group>

        <button className="btn-primary mb-2 h-12 w-full" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>

        <button
          className="flex w-full items-center justify-center gap-2 py-4 text-[15px] font-semibold text-z-ink"
          onClick={() => navigate("/support")}
        >
          <FiHelpCircle size={16} /> Help & support
        </button>

        <button
          className="flex w-full items-center justify-center gap-2 py-3 text-[15px] font-semibold text-z-danger"
          onClick={logout}
        >
          <FiLogOut size={15} /> Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Group({ title, extra, children }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-end justify-between px-1">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-z-accent">{title}</h3>
        {extra ? <span className="text-[12px] font-bold text-z-accent">{extra}</span> : null}
      </div>
      <div className="divide-y divide-z-line-soft overflow-hidden rounded-[20px] bg-white shadow-card">{children}</div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="shrink-0 text-[13px] text-z-muted">{label}</span>
      {children}
    </div>
  );
}
