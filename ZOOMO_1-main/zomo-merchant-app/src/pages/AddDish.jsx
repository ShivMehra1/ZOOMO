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
    <div className="max-w-3xl" ref={topRef}>

      {/* ── SUCCESS NOTIFICATION ── */}
      {saved && (
        <div className="
          mb-6 flex items-center gap-3
          px-5 py-4 rounded-2xl
          bg-emerald-50 dark:bg-emerald-500/10
          border border-emerald-200 dark:border-emerald-500/30
          shadow-sm
          animate-fade-in
        ">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Dish saved successfully!
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-0.5">
              Redirecting to your menu in a moment…
            </p>
          </div>
        </div>
      )}

      {/* ── ERROR NOTIFICATION ── */}
      {submitError && (
        <div className="
          mb-6 flex items-center gap-3
          px-5 py-4 rounded-2xl
          bg-red-50 dark:bg-red-500/10
          border border-red-200 dark:border-red-500/30
        ">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Add New Dish
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Create a new item for your restaurant menu
        </p>
      </div>

      {/* ── RESTAURANT LOAD ERROR ── */}
      {loadError && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── FORM CARD ── */}
      <div className="bg-white/80 dark:bg-[#0f0f0f] backdrop-blur rounded-3xl p-6 border border-black/10 dark:border-white/10">
        <DishForm
          onSubmit={submit}
          saving={saving}
        />
      </div>
    </div>
  );
}