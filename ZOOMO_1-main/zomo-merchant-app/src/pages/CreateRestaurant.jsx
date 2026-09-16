import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CreateRestaurant() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    openingHours: "",
    cuisineType: "",
    priceRange: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.address) {
      setError("Restaurant name and address are required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/merchant/restaurants", form);

      // ✅ Restaurant created → dashboard will redirect correctly
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create restaurant"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <p className="kicker mb-2">Merchant</p>
      <h1 className="display text-[28px] text-z-ink mb-1">
        Create your restaurant
      </h1>
      <p className="text-sm text-z-sub mb-6">
        Tell us about your restaurant so customers can find you.
      </p>

      <div className="card p-6">
        {error && (
          <p className="mb-4 rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            placeholder="Restaurant Name"
            className="field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <textarea
            placeholder="Full Address"
            className="field"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input
            placeholder="Restaurant Phone"
            className="field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            placeholder="Restaurant Email"
            className="field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Opening Hours (e.g. 9 AM - 11 PM)"
            className="field"
            value={form.openingHours}
            onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
          />

          <input
            placeholder="Cuisine Type (e.g. Italian)"
            className="field"
            value={form.cuisineType}
            onChange={(e) => setForm({ ...form, cuisineType: e.target.value })}
          />

          <select
            className="field"
            value={form.priceRange}
            onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
          >
            <option value="">Price Range</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>

          <button type="submit" disabled={loading} className="btn-primary w-full h-12">
            {loading ? "Saving..." : "Save Restaurant"}
          </button>
        </form>
      </div>
    </div>
  );
}
