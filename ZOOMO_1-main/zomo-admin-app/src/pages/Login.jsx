import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

export default function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/admin/analytics');
    else setError('Invalid credentials. Try again.');
  }

  return (
    <div className="min-h-screen bg-z-page flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute w-96 h-96 bg-z-sage/60 rounded-full blur-3xl top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-z-surface border border-z-line mb-4 shadow-card">
            <img src="/brand/mark-on-white.png" alt="Zoomo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-z-ink">ZOOMO</h1>
          <p className="text-z-muted text-sm mt-1">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-z-surface border border-z-line rounded-card p-8 shadow-card space-y-5">

          <div>
            <h2 className="text-xl font-semibold text-z-ink">Welcome back</h2>
            <p className="text-z-muted text-sm mt-1">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="bg-z-danger/10 border border-z-danger/20 text-z-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm text-z-sub font-medium">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={16} />
                <input
                  type="email"
                  placeholder="admin@zoomoeats.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-z-page border border-z-line text-z-ink placeholder-z-muted rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-z-accent/40 focus:border-z-primary transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-z-sub font-medium">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-z-muted" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-z-page border border-z-line text-z-ink placeholder-z-muted rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-z-accent/40 focus:border-z-primary transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-z-primary hover:bg-z-hover text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn size={15} />
                  Sign In
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-z-muted text-xs mt-6">
          Zoomo Admin — Restricted Access Only
        </p>

      </div>
    </div>
  );
}
