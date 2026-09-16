import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DishForm from "../components/DishForm";
import api from "../services/api";

export default function AddDish() {
  const navigate = useNavigate();
  const topRef = useRef(null);

  const [restaurantId, setRestaurantId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ✅ FIX 1: fetch restaurantId from the API instead of relying on
  // navigation state that Menu.jsx never actually passes.
  useEffect(() => {
    api.get("/merchant/restaurants/me")
      .then(res => setRestaurantId(res.data?.id))
      .catch(() => setLoadError("Could not load your restaurant. Please try again."));
  }, []);

  const submit = async (data) => {
    if (!restaurantId) {
      setSubmitError("Restaurant not loaded yet — please wait a moment and try again.");
      return;
    }

    setSubmitError("");
    setSaving(true);

    try {
      // ✅ FIX 2: wrap in try/catch so errors are shown, not swallowed.
      // The backend reads restaurantId from the merchant JWT, so we
      // don't need to send it in the body — but it also doesn't hurt.
      await api.post("/merchant/dishes", {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl || null,
        ingredients: data.ingredients,
        calories: data.calories,
        preparationTime: data.preparationTime,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        isGlutenFree: data.isGlutenFree,
        isAvailable: data.isAvailable,
      });

      // ✅ FIX 3: scroll to top and show notification for 5 sec
      setSaved(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        setSaved(false);
        navigate("/menu");
      }, 5000);

    } catch (err) {
      const msg = err?.response?.data?.message;
      setSubmitError(
        Array.isArray(msg) ? msg.join(", ") :
          typeof msg === "string" ? msg :
            "Failed to save dish. Please check all fields and try again."
      );
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto" ref={topRef}>
      {/* ── SUCCESS NOTIFICATION ── */}
      {saved && (
        <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl bg-z-sage border border-z-accent/20">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-z-primary">Dish saved successfully!</p>
            <p className="text-sm text-z-primary/80 mt-0.5">Redirecting to your menu in a moment…</p>
          </div>
        </div>
      )}

      {/* ── ERROR NOTIFICATION ── */}
      {submitError && (
        <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl bg-z-danger/10 border border-z-danger/20">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-z-danger">{submitError}</p>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="mb-5">
        <p className="kicker mb-1">Menu</p>
        <h1 className="display text-2xl text-z-ink">Add New Dish</h1>
        <p className="text-sm text-z-sub mt-1">Create a new item for your restaurant menu</p>
      </div>

      {/* ── RESTAURANT LOAD ERROR ── */}
      {loadError && (
        <div className="mb-5 px-5 py-4 rounded-2xl bg-z-danger/10 border border-z-danger/20">
          <p className="text-sm text-z-danger">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm text-z-danger underline">
            Retry
          </button>
        </div>
      )}

      <DishForm onSubmit={submit} saving={saving} />
    </div>
  );
}
