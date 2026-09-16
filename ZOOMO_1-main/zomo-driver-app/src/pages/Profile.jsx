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
        <Header title="Rider" />
        <p className="text-center text-sm text-z-sub mt-20">Loading profile...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-z-page pb-28">
      <Header title="Rider" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="kicker mb-1">Account</p>
        <h1 className="display text-2xl text-z-ink mb-6">Your profile</h1>

        {error && (
          <p className="mb-4 rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">{error}</p>
        )}

        <div className="rounded-card p-5 shadow-card bg-z-surface mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-z-sage flex items-center justify-center border border-z-line"
              >
                {profile?.user?.avatarUrl ? (
                  <img src={profile.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="display text-2xl text-z-primary">
                    {(name || "D").charAt(0).toUpperCase()}
                  </span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <span className="text-white text-[10px] font-bold">Uploading</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-z-primary text-white flex items-center justify-center border-2 border-z-surface"
                aria-label="Change photo"
              >
                <FiCamera size={12} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-z-ink truncate">{name || "Driver"}</p>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-z-sage px-2.5 py-1 text-[11px] font-bold text-z-primary">
                <FiStar size={11} />
                {profile?.rating ?? "—"} rating
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-card p-5 shadow-card bg-z-surface mb-4 space-y-3">
          <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">Personal details</p>
          <div>
            <label className="text-xs font-semibold text-z-sub">Name</label>
            <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-sub">Phone</label>
            <input className="field mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-sub">Email</label>
            <input className="field mt-1 opacity-60" value={profile?.user?.email || ""} disabled />
          </div>
        </div>

        <div className="rounded-card p-5 shadow-card bg-z-surface mb-4 space-y-3">
          <p className="text-[11px] font-bold tracking-wide text-z-muted uppercase">Vehicle</p>
          <div>
            <label className="text-xs font-semibold text-z-sub">Vehicle type</label>
            <input
              className="field mt-1"
              placeholder="e.g. Bike, Scooter, Car"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-z-sub">Plate number</label>
            <input className="field mt-1" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary h-12 w-full mb-3" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
        </button>

        <button
          className="btn-ghost h-11 w-full mb-3 flex items-center justify-center gap-2"
          onClick={() => navigate("/support")}
        >
          <FiHelpCircle size={15} /> Help & support
        </button>

        <button
          className="w-full h-11 rounded-xl border border-z-line text-z-danger font-bold flex items-center justify-center gap-2"
          onClick={logout}
        >
          <FiLogOut size={15} /> Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
