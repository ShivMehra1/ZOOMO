import { useEffect, useState, useRef } from "react";
import RestaurantForm from "../components/RestaurantForm";
import ImageUpload from "../components/ImageUpload";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RestaurantProfile() {
  const topRef = useRef(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const [me, setMe] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);

  // Fetch restaurant profile + the owner's own account (for the personal photo)
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await api.get("/merchant/restaurants/me");
        setRestaurant(res.data);
      } catch (err) {
        setLoadError(
          err.response?.data?.message ||
          "Failed to load restaurant profile"
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchMe = async () => {
      try {
        const res = await api.get("/users/me");
        setMe(res.data);
        if (res.data?.avatarUrl) setAvatarImage({ preview: res.data.avatarUrl, url: res.data.avatarUrl });
      } catch {
        // non-critical — the personal photo card just won't pre-fill
      }
    };

    fetchRestaurant();
    fetchMe();
  }, []);

  // Personal avatar upload finishes instantly via ImageUpload — persist it as soon as we have a URL
  useEffect(() => {
    if (avatarImage?.url && avatarImage.url !== me?.avatarUrl) {
      api.patch("/users/me", { avatarUrl: avatarImage.url }).then((res) => setMe(res.data)).catch(() => {});
    }
  }, [avatarImage?.url]);

  const toggleActive = async () => {
    if (!restaurant) return;
    const next = !restaurant.isActive;
    setTogglingActive(true);
    try {
      await api.patch(`/merchant/restaurants/${restaurant.id}`, { isActive: next });
      setRestaurant((prev) => ({ ...prev, isActive: next }));
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update restaurant status");
    } finally {
      setTogglingActive(false);
    }
  };

  // Save profile updates
  const saveProfile = async (data) => {
    setSaveError("");
    setSaved(false);
    try {
      await api.patch(
        `/merchant/restaurants/${restaurant.id}`,
        data
      );

      setRestaurant((prev) => ({ ...prev, ...data }));
      setSaved(true);
      // ✅ Scroll to top so the notification is visible
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // ✅ Auto-dismiss after 5 seconds
      setTimeout(() => setSaved(false), 5000);
    } catch (err) {
      // ✅ FIX: this used to set the same `error` state that replaces
      // the entire page with an error box, hiding the form. Now a
      // failed save shows inline above the form instead, so you can
      // see what went wrong and try again without losing your edits.
      setSaveError(
        err.response?.data?.message ||
        "Failed to update restaurant profile"
      );
    }
  };

  if (loading) {
    return <p className="text-z-sub text-sm py-12 text-center">Loading restaurant profile...</p>;
  }

  // Only a failed INITIAL LOAD replaces the page — a failed save does not.
  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto card p-6">
        <p className="text-z-danger text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5" ref={topRef}>
      {/* SUCCESS NOTIFICATION */}
      {saved && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-z-sage border border-z-accent/20">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-z-primary">Restaurant profile saved!</p>
            <p className="text-sm text-z-primary/80 mt-0.5">Your changes are now live on the customer app.</p>
          </div>
        </div>
      )}

      {/* ERROR NOTIFICATION */}
      {saveError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-z-danger/10 border border-z-danger/20">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-z-danger">{saveError}</p>
        </div>
      )}

      {/* HEADER */}
      <div>
        <p className="kicker mb-1">Restaurant</p>
        <h1 className="display text-2xl text-z-ink">Restaurant Profile</h1>
        <p className="text-sm text-z-sub mt-1">Manage your restaurant's information visible to customers</p>
      </div>

      {/* ================= BUSY MODE — the single most important real-time control ================= */}
      <div className={`card p-5 flex items-center justify-between gap-4 ${restaurant.isActive ? "" : "ring-2 ring-z-danger/40"}`}>
        <div>
          <p className="kicker mb-1">{restaurant.isActive ? "Live" : "Paused"}</p>
          <h3 className="text-lg font-bold text-z-ink">
            {restaurant.isActive ? "Restaurant is Open" : "Restaurant is Paused"}
          </h3>
          <p className="text-sm text-z-sub mt-0.5">
            {restaurant.isActive
              ? "You're accepting new orders right now."
              : "New orders are blocked until you turn this back on."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleActive}
          disabled={togglingActive}
          className={`shrink-0 h-11 px-6 rounded-full font-bold text-sm transition disabled:opacity-60 ${
            restaurant.isActive ? "bg-z-danger text-white hover:bg-z-danger/90" : "btn-primary"
          }`}
        >
          {togglingActive ? "..." : restaurant.isActive ? "Pause Orders" : "Go Live"}
        </button>
      </div>

      {/* ================= PERSONAL PROFILE PHOTO (owner, distinct from restaurant cover photo) ================= */}
      <div className="card p-5 flex items-center gap-4">
        <ImageUpload image={avatarImage} setImage={setAvatarImage} folder="avatars" />
        <div>
          <h3 className="text-base font-bold text-z-ink">Your profile photo</h3>
          <p className="text-sm text-z-sub mt-0.5">{me?.name || "Restaurant owner"} — shown to Zoomo staff, not on your public listing.</p>
        </div>
      </div>

      <RestaurantForm restaurant={restaurant} onSubmit={saveProfile} />
    </div>
  );
}
