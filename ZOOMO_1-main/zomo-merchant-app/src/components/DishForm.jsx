import { useState } from "react";
import api from "../services/api";
import GreenSwitch from "./GreenSwitch";

export default function DishForm({ initialData = {}, onSubmit, saving = false }) {
  const [form, setForm] = useState({
    name: initialData.name || "",
    description: initialData.description || "",
    price: initialData.price || "",
    imageUrl: initialData.imageUrl || "",
    ingredients: initialData.ingredients || "",
    calories: initialData.calories || "",
    preparationTime: initialData.preparationTime || "",
    isVegetarian: initialData.isVegetarian || false,
    isVegan: initialData.isVegan || false,
    isGlutenFree: initialData.isGlutenFree || false,
    isAvailable:
      initialData.isAvailable !== undefined
        ? initialData.isAvailable
        : true,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ✅ FIX: this used to just guess `/${file.name}` as the image path —
  // a fake URL that assumed the file already existed in the deployed
  // public/ folder. It never actually uploaded anything, which is why
  // dish photos never appeared on the customer app. Now it really
  // uploads the file and stores the permanent Cloudinary URL returned.
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        "/upload/image?folder=dishes",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const uploadedUrl = res.data?.url;
      if (!uploadedUrl) throw new Error("No URL returned from upload");

      setForm((f) => ({ ...f, imageUrl: uploadedUrl }));
    } catch (err) {
      console.error("Dish image upload failed:", err);
      setUploadError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (uploading) {
      setUploadError("Please wait for the image to finish uploading.");
      return;
    }
    // ✅ FIX: coerce empty string values for optional Int fields to null
    // so Prisma doesn't receive "" for an Int? column → 500 error.
    onSubmit({
      ...form,
      price: form.price,
      calories: form.calories !== "" ? form.calories : null,
      preparationTime: form.preparationTime !== "" ? form.preparationTime : null,
      ingredients: form.ingredients !== "" ? form.ingredients : null,
      description: form.description !== "" ? form.description : null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* ================= BASIC INFO ================= */}
      <Section title="Basic Information">
        <Field label="Dish Name" required>
          <input name="name" value={form.name} onChange={handleChange} className="field" required />
        </Field>

        <Field label="Description">
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="field" />
        </Field>
      </Section>

      {/* ================= PRICING & PREP ================= */}
      <Section title="Pricing & Preparation">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Price (₹)" required>
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} className="field" required />
          </Field>

          <Field label="Preparation Time (mins)">
            <input name="preparationTime" type="number" value={form.preparationTime} onChange={handleChange} className="field" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Calories">
            <input name="calories" type="number" value={form.calories} onChange={handleChange} className="field" />
          </Field>

          <Field label="Ingredients">
            <input name="ingredients" value={form.ingredients} onChange={handleChange} className="field" />
          </Field>
        </div>
      </Section>

      {/* ================= IMAGE ================= */}
      <Section title="Dish Image">
        <div className="flex flex-col sm:flex-row gap-5 items-center">
          <div className="relative w-32 h-32 rounded-2xl bg-z-page border border-dashed border-z-line flex items-center justify-center overflow-hidden shrink-0">
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Dish preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <img src="/zoomo-mascot.png" alt="Upload dish" className="w-16 opacity-30" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Uploading...</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-bold mb-1 text-z-ink">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm text-z-sub"
            />
            <p className="text-xs text-z-muted mt-1">This image will be shown to customers</p>
            {uploadError && <p className="text-xs text-z-danger mt-1">{uploadError}</p>}
          </div>
        </div>
      </Section>

      {/* ================= DIETARY ================= */}
      <Section title="Dietary Information">
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label="Vegetarian" name="isVegetarian" checked={form.isVegetarian} onChange={handleChange} />
          <Toggle label="Vegan" name="isVegan" checked={form.isVegan} onChange={handleChange} />
          <Toggle label="Gluten Free" name="isGlutenFree" checked={form.isGlutenFree} onChange={handleChange} />
          <Toggle label="Available" name="isAvailable" checked={form.isAvailable} onChange={handleChange} />
        </div>
      </Section>

      {/* ================= SUBMIT ================= */}
      <button type="submit" disabled={uploading || saving} className="btn-primary w-full h-12">
        {uploading ? "Uploading image..." : saving ? "Saving dish..." : "Save Dish"}
      </button>
    </form>
  );
}

/* ================= UI HELPERS ================= */

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-base font-bold text-z-ink">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-bold text-z-ink mb-1">
        {label}
        {required && <span className="text-z-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, name, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-z-page text-z-ink">
      <span className="text-sm font-bold">{label}</span>
      <GreenSwitch
        on={Boolean(checked)}
        label={label}
        onToggle={() =>
          onChange({ target: { name, type: "checkbox", checked: !checked } })
        }
      />
    </div>
  );
}
