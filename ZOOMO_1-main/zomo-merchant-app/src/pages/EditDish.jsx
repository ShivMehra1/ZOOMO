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

  if (loading) return <p className="text-z-sub text-sm py-12 text-center">Loading dish...</p>;

  if (loadError) return (
    <div className="max-w-3xl mx-auto px-5 py-4 rounded-2xl bg-z-danger/10 border border-z-danger/20">
      <p className="text-sm text-z-danger">{loadError}</p>
      <button onClick={() => navigate("/menu")} className="mt-2 text-sm text-z-danger underline">
        Back to Menu
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto" ref={topRef}>
      {/* ── SUCCESS NOTIFICATION ── */}
      {saved && (
        <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl bg-z-sage border border-z-accent/20">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-z-primary">Dish updated successfully!</p>
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
        <h1 className="display text-2xl text-z-ink">Edit Dish</h1>
        <p className="text-sm text-z-sub mt-1">Update this dish on your menu</p>
      </div>

      <DishForm initialData={dish} onSubmit={submit} saving={saving} mode="edit" />
    </div>
  );
}
