import { useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { useDriverAuth } from "../context/DriverAuthContext";
import { driverLogin } from "../services/driverApi";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useDriverAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authLoading && isAuthenticated) return <Navigate to="/home" replace />;

  const handleLogin = async () => {
    setError("");
    try {
      setLoading(true);
      const data = await driverLogin(email, password);
      login(data);
      navigate("/home");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-z-page px-5 py-10">
      <div className="mx-auto max-w-[420px]">
        <div className="mb-8 flex items-center gap-2.5">
          <img
            src="/brand/mark-on-white.png"
            alt="Zoomo"
            className="w-9 h-9 rounded-[22%] object-contain"
          />
          <span className="text-base font-bold text-z-ink">
            Zoomo Eats
          </span>
        </div>

        <p className="kicker mb-2">Driver</p>
        <h1 className="display mb-2 text-[32px] text-z-ink">
          Sign in
        </h1>
        <p className="mb-6 text-sm text-z-sub">
          Start delivering with Zoomo
        </p>

        <div className="space-y-3">
          {error && (
            <p className="rounded-xl bg-z-danger/10 px-3 py-2 text-[13px] text-z-danger">
              {error}
            </p>
          )}
          <input
            type="email"
            className="field"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary h-12 w-full"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-z-muted">
          Use your registered driver credentials
        </p>
      </div>
    </div>
  );
}
