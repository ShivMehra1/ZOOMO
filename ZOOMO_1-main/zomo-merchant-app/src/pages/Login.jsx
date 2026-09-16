// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) return setError("Email & password required");

    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-z-page px-5 py-10">
      <div className="mx-auto max-w-[420px]">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-9 h-9 rounded-[22%] object-contain" />
          <span className="text-base font-bold text-z-ink">Zoomo Eats</span>
        </Link>

        <p className="kicker mb-2">Merchant</p>
        <h1 className="display mb-2 text-[32px] text-z-ink">Sign in</h1>
        <p className="mb-6 text-sm text-z-sub">
          Manage your restaurant, menu, and incoming orders.
        </p>

        <form className="space-y-3" onSubmit={submit}>
          {error && (
            <p className="rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">{error}</p>
          )}
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn-primary h-12 w-full" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-z-sub">
          Don't have a merchant account?{" "}
          <Link to="/signup" className="font-bold text-z-primary">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
