import React from "react";
import ImageUpload from "./ImageUpload";

// ✅ FIX: the backend stores address as a single merged string
// ("Shop, Area, City, State, Pincode, Country"). When editing an
// EXISTING restaurant, the form previously always started with
// shop/area/city/state/pincode as empty strings — so the required-field
// check in submit() always failed silently (just an alert(), no API
// call), making "Save Changes" look like it does nothing.
// This parses the existing address back into its parts so editing
// a restaurant that already has an address actually works.
function parseAddress(address) {
  if (!address) {
    return { shop: "", area: "", city: "", state: "", pincode: "", country: "India" };
  }
  const parts = address.split(",").map((p) => p.trim());
  // Expected order from RestaurantForm's own merge: shop, area, city, state, pincode, country
  // Some entries (esp. ones created via onboarding's free-text "Full Address")
  // may not have exactly 6 parts, so we fill what we can and never leave
  // the validation-required fields silently blank if there's *any* data.
  const [shop = "", area = "", city = "", state = "", pincode = "", country = "India"] = parts;
  return { shop, area, city, state, pincode, country: country || "India" };
}

export default function RestaurantForm({ restaurant, onSubmit }) {
  /* ===========================
     FORM STATE
  =========================== */
  const parsedAddress = parseAddress(restaurant?.address);

  const [form, setForm] = React.useState({
    name: restaurant?.name || "",
    description: restaurant?.description || "",
    phone: restaurant?.phone || "",
    email: restaurant?.email || "",
    openingHours: restaurant?.openingHours || "",
    cuisineType: restaurant?.cuisineType || "",
    priceRange: restaurant?.priceRange || "",
    // 🔥 STRUCTURED ADDRESS (now pre-filled from existing restaurant.address)
    shop: parsedAddress.shop,
    area: parsedAddress.area,
    city: parsedAddress.city,
    state: parsedAddress.state,
    pincode: parsedAddress.pincode,
    country: parsedAddress.country,
  });

  const [image, setImage] = React.useState(
    restaurant?.imageUrl ? { preview: restaurant.imageUrl } : null
  );

  const [validationError, setValidationError] = React.useState("");

  /* ===========================
     SUBMIT
  =========================== */
  const submit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (
      !form.name ||
      !form.shop ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      // ✅ FIX: show this inline (not just a dismissible alert) so it's
      // obvious why nothing was saved, instead of looking like a no-op.
      setValidationError(
        "Please fill all required fields marked with * (Restaurant Name, Shop/Building, City, State, Pincode)."
      );
      return;
    }

    if (image?.uploading) {
      setValidationError("Please wait for the image to finish uploading.");
      return;
    }

    // 🔥 MERGE ADDRESS (GEOCODER-FRIENDLY)
    const mergedAddress = [
      form.shop,
      form.area,
      form.city,
      form.state,
      form.pincode,
      form.country,
    ]
      .filter(Boolean)
      .join(", ");

    onSubmit({
      name: form.name,
      description: form.description,
      address: mergedAddress, // 👈 SINGLE STRING (schema unchanged)
      phone: form.phone,
      email: form.email,
      openingHours: form.openingHours,
      cuisineType: form.cuisineType,
      priceRange: form.priceRange,
      // ✅ FIX: send the real uploaded URL string, not the whole
      // { file, preview } object (which silently turned into "{}"
      // over JSON and never reached the database).
      imageUrl: image?.url ?? restaurant?.imageUrl ?? null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {validationError && (
        <div className="rounded-xl bg-z-danger/10 border border-z-danger/20 px-4 py-3">
          <p className="text-sm text-z-danger">{validationError}</p>
        </div>
      )}

      {/* ================= IMAGE ================= */}
      <Section title="Restaurant Image">
        <ImageUpload image={image} setImage={setImage} folder="restaurants" />
        <p className="text-xs text-z-muted">This image will be shown to customers</p>
      </Section>

      {/* ================= BASIC INFO ================= */}
      <Section title="Basic Information">
        <Field label="Restaurant Name" required>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Field label="Description">
          <textarea className="field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </Section>

      {/* ================= ADDRESS ================= */}
      <Section title="Restaurant Address">
        <Field label="Shop / Building / Landmark" required>
          <input className="field" value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} />
        </Field>

        <Field label="Area / Locality">
          <input className="field" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City" required>
            <input className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>

          <Field label="State" required>
            <input className="field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Pincode" required>
            <input className="field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </Field>

          <Field label="Country">
            <input className="field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* ================= CONTACT ================= */}
      <Section title="Contact Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>

          <Field label="Email">
            <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* ================= BUSINESS INFO ================= */}
      <Section title="Business Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Opening Hours">
            <input className="field" placeholder="e.g. 10 AM – 11 PM" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          </Field>

          <Field label="Cuisine Type">
            <input className="field" placeholder="e.g. Italian, Indian" value={form.cuisineType} onChange={(e) => setForm({ ...form, cuisineType: e.target.value })} />
          </Field>
        </div>

        <Field label="Price Range">
          <select className="field" value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })}>
            <option value="">Select price range</option>
            <option value="$">$ (Budget)</option>
            <option value="$$">$$ (Mid-range)</option>
            <option value="$$$">$$$ (Premium)</option>
            <option value="$$$$">$$$$ (Luxury)</option>
          </select>
        </Field>
      </Section>

      {/* ================= SUBMIT ================= */}
      <button type="submit" className="btn-primary w-full h-12">
        Save Changes
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
