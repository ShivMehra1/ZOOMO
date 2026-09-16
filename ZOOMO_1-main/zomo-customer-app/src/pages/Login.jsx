import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39",
  accent: "#1F7A52", textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E",
  border: "#DCE6E0", borderSoft: "#EEF3F0", error: "#DC2626",
};

function ZMark() {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 16, background: C.primary,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
        <path d="M6 10H22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M22 10L10 22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10 22H26" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, icon: Icon, required, name }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ color: C.textSub, fontSize: 13, fontWeight: 500 }}>{label}</label>
      <div style={{
        position: "relative", display: "flex", alignItems: "center",
        border: `1.5px solid ${focused ? C.primary : C.border}`,
        borderRadius: 12, background: C.surface,
        boxShadow: focused ? `0 0 0 3px ${C.primary}18` : "none",
        transition: "border-color 120ms, box-shadow 120ms"
      }}>
        {Icon && (
          <div style={{
            position: "absolute", left: 14, color: focused ? C.primary : C.textMuted,
            display: "flex", alignItems: "center", pointerEvents: "none",
            transition: "color 120ms"
          }}>
            <Icon />
          </div>
        )}
        <input
          name={name} type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          required={required} placeholder={placeholder}
          style={{
            width: "100%", height: 48, paddingLeft: Icon ? 42 : 14, paddingRight: 14,
            border: "none", outline: "none", background: "transparent",
            color: C.textMain, fontSize: 15, fontFamily: "inherit"
          }}
        />
      </div>
    </div>
  );
}

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const EyeIcon = ({ open }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
    }
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.page,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Satoshi', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
        * { box-sizing: border-box; }
        body { background: ${C.page} !important; }
        html.dark body { background: ${C.page} !important; }
        input::placeholder { color: #8A938E; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .login-card { animation: fadeUp 0.35s ease-out both; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Card */}
        <div className="login-card" style={{
          background: C.surface, borderRadius: 28,
          boxShadow: "0 10px 48px rgba(15,61,46,0.10)",
          border: `1px solid ${C.borderSoft}`, overflow: "hidden"
        }}>

          {/* Header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
            padding: "32px 32px 28px", textAlign: "center"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <ZMark />
            </div>
            <h1 style={{
              color: "#fff", fontSize: 26, fontWeight: 700, lineHeight: "34px",
              letterSpacing: "-0.015em", marginBottom: 6
            }}>
              Welcome back
            </h1>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 14 }}>
              Login to continue your delicious journey
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: "28px 32px 32px" }}>
            {error && (
              <div style={{
                marginBottom: 16, padding: "12px 16px", borderRadius: 12,
                background: `${C.error}10`, border: `1px solid ${C.error}30`,
                color: C.error, fontSize: 13, display: "flex", alignItems: "center", gap: 8
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField label="Email address" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                icon={MailIcon} required name="email" />

              {/* Password with show/hide */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ color: C.textSub, fontSize: 13, fontWeight: 500 }}>Password</label>
                  <button type="button" style={{
                    background: "none", border: "none", color: C.primary,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    padding: 0
                  }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{
                  position: "relative", display: "flex", alignItems: "center",
                  border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.surface,
                  transition: "border-color 120ms, box-shadow 120ms"
                }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ position: "absolute", left: 14, color: C.textMuted, display: "flex", pointerEvents: "none" }}>
                    <LockIcon />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: "100%", height: 48, paddingLeft: 42, paddingRight: 44,
                      border: "none", outline: "none", background: "transparent",
                      color: C.textMain, fontSize: 15, fontFamily: "inherit"
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{
                      position: "absolute", right: 12, background: "none", border: "none",
                      color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center",
                      padding: 4
                    }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", height: 50, borderRadius: 12, border: "none",
                  background: loading ? C.textMuted : `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", marginTop: 4, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 16px rgba(15,61,46,0.25)",
                  transition: "all 120ms"
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,61,46,0.35)")}
                onMouseLeave={e => !loading && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.25)")}
              >
                {loading ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span key={i} style={{
                        width: 7, height: 7, background: "#fff", borderRadius: "50%",
                        display: "inline-block", animation: "bounce 0.8s ease-in-out infinite",
                        animationDelay: `${d}s`
                      }} />
                    ))}
                  </span>
                ) : "Login to Zoomo Eats"}
              </button>
            </form>

            {/* Sign up link */}
            <p style={{ textAlign: "center", marginTop: 20, color: C.textSub, fontSize: 14 }}>
              Don't have an account?{" "}
              <Link to="/signup" style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}
                onMouseEnter={e => e.target.style.textDecoration = "underline"}
                onMouseLeave={e => e.target.style.textDecoration = "none"}
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Trust pills */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginTop: 16, flexWrap: "wrap"
        }}>
          {["Free delivery on signup", "4.8★ rated", "Secure login"].map(t => (
            <span key={t} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 999, background: C.surface,
              border: `1px solid ${C.border}`, fontSize: 11, color: C.textSub
            }}>
              <span style={{ color: C.accent, fontWeight: 700 }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}