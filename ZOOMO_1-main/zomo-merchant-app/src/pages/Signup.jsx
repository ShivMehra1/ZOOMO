// src/pages/Signup.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone || !form.password)
      return setError("All fields are required");

    if (form.phone.length < 10)
      return setError("Enter a valid phone number");

    try {
      setLoading(true);
      await signup(form);
      // ✅ FIX: New merchants have no restaurant yet — send them to
      // onboarding (CreateRestaurant) first. Dashboard assumes a
      // restaurant already exists and will crash otherwise.
      navigate("/onboarding", { replace: true });
    } catch {
      setError("Signup failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Full Name", key: "name" },
    { label: "Email Address", key: "email", type: "email" },
    { label: "Phone Number", key: "phone", type: "tel" },
    { label: "Password", key: "password", type: "password" },
  ];

  return (
    <div className="min-h-screen bg-z-page px-5 py-10">
      <div className="mx-auto max-w-[420px]">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-9 h-9 rounded-[22%] object-contain" />
          <span className="text-base font-bold text-z-ink">Zoomo Eats</span>
        </Link>

        <p className="kicker mb-2">Merchant</p>
        <h1 className="display mb-2 text-[32px] text-z-ink">Create account</h1>
        <p className="mb-6 text-sm text-z-sub">
          Start managing your restaurant on Zoomo.
        </p>

        <form className="space-y-3" onSubmit={submit}>
          {error && (
            <p className="rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">{error}</p>
          )}
          {fields.map(({ label, key, type = "text" }) => (
            <input
              key={key}
              type={type}
              className="field"
              placeholder={label}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <button type="submit" className="btn-primary h-12 w-full" disabled={loading}>
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <p className="text-sm text-center text-z-sub mt-6">
          Already have a merchant account?{" "}
          <Link to="/login" className="font-bold text-z-primary">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
