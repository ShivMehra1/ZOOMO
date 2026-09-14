import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import DishForm from "../components/DishForm";
import api from "../services/api";

export default function EditDish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const topRef = useRef(null);

  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/merchant/dishes/${id}`)
      .then(res => setDish(res.data))
      .catch(() => setLoadError("Failed to load dish. Please go back and try again."))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (data) => {
    setSubmitError("");
    setSaving(true);
    try {
      await api.patch(`/merchant/dishes/${id}`, {
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
            "Failed to update dish. Please try again."
      );
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading dish...</p>;

  if (loadError) return (
    <div className="px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
      <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      <button onClick={() => navigate("/menu")} className="mt-2 text-sm text-red-600 underline">
        Back to Menu
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl" ref={topRef}>

      {/* ── SUCCESS NOTIFICATION ── */}
      {saved && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Dish updated successfully!
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-0.5">
              Redirecting to your menu in a moment…
            </p>
          </div>
        </div>
      )}

      {/* ── ERROR NOTIFICATION ── */}
      {submitError && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit Dish</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Update this dish on your menu
        </p>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-white/80 dark:bg-[#0f0f0f] backdrop-blur rounded-3xl p-6 border border-black/10 dark:border-white/10">
        <DishForm
          initialData={dish}
          onSubmit={submit}
          saving={saving}
          mode="edit"
        />
      </div>
    </div>
  );
}