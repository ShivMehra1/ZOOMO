import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  page: "#F4F7F5", surface: "#FFFFFF", primary: "#0F3D2D", hover: "#164A39",
  accent: "#1F7A52", textMain: "#0C1612", textSub: "#5A6660", textMuted: "#8A938E",
  border: "#DCE6E0", borderSoft: "#EEF3F0", error: "#DC2626",
};

/* ── Icons ── */
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
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
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
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
const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

/* ── Input component ── */
function Field({ label, type = "text", value, onChange, placeholder, Icon, required, name }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ color: C.textSub, fontSize: 13, fontWeight: 500 }}>{label}</label>}
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
            display: "flex", alignItems: "center", pointerEvents: "none", transition: "color 120ms"
          }}>
            <Icon />
          </div>
        )}
        <input
          name={name} type={inputType} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          required={required} placeholder={placeholder}
          style={{
            width: "100%", height: 48, paddingLeft: Icon ? 42 : 14,
            paddingRight: isPassword ? 44 : 14,
            border: "none", outline: "none", background: "transparent",
            color: C.textMain, fontSize: 15, fontFamily: "inherit"
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{
              position: "absolute", right: 12, background: "none", border: "none",
              color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", padding: 4
            }}>
            <EyeIcon open={showPw} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step indicator ── */
function StepDots({ step, total = 2 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 999,
          width: i === step - 1 ? 24 : 8,
          background: i < step ? C.accent : "rgba(255,255,255,0.25)",
          transition: "all 180ms ease-out",
        }} />
      ))}
      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginLeft: 4 }}>
        {step} / {total}
      </span>
    </div>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  function nextStep() {
    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (!form.email.trim()) { setError("Please enter your email."); return; }
    setError(""); setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.password) { setError("Please create a password."); return; }
    setError(""); setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed. Please try again.");
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
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .signup-card { animation: fadeUp 0.35s ease-out both; }
        .step-slide { animation: fadeUp 0.25s ease-out both; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="signup-card" style={{
          background: C.surface, borderRadius: 28,
          boxShadow: "0 10px 48px rgba(15,61,46,0.10)",
          border: `1px solid ${C.borderSoft}`, overflow: "hidden"
        }}>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
            padding: "28px 32px 24px"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                    <path d="M6 10H22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M22 10L10 22" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M10 22H26" stroke="#1F7A52" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
                  Zoomo <span style={{ color: C.accent }}>Eats</span>
                </span>
              </div>
              <StepDots step={step} />
            </div>
            <h1 style={{
              color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: "-0.015em",
              lineHeight: "32px", marginBottom: 4
            }}>
              {step === 1 ? "Create your account" : "Almost there!"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 13 }}>
              {step === 1 ? "Join thousands ordering smarter every day" : "Set a secure password and you're ready"}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 32px 32px" }}>
            {error && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 10,
                background: `${C.error}10`, border: `1px solid ${C.error}30`,
                color: C.error, fontSize: 13, display: "flex", alignItems: "center", gap: 8
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="step-slide" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Full name" type="text" name="name" value={form.name} onChange={change}
                  placeholder="Your full name" Icon={UserIcon} required />
                <Field label="Email address" type="email" name="email" value={form.email} onChange={change}
                  placeholder="you@example.com" Icon={MailIcon} required />

                <button
                  type="button" onClick={nextStep}
                  style={{
                    width: "100%", height: 50, borderRadius: 12, border: "none", marginTop: 4,
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 16px rgba(15,61,46,0.25)", transition: "box-shadow 120ms"
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,61,46,0.35)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.25)"}
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ color: C.textMuted, fontSize: 12 }}>or sign up with</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                {/* Social */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["🌐", "Google"], ["🍎", "Apple"]].map(([emoji, name]) => (
                    <button key={name}
                      style={{
                        height: 44, borderRadius: 12, border: `1.5px solid ${C.border}`,
                        background: C.surface, color: C.textMain, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: 6, transition: "all 120ms"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.page; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
                    >
                      {emoji} {name}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: "16px" }}>
                  By creating an account you agree to our{" "}
                  <a href="#" style={{ color: C.primary, textDecoration: "none" }}>Terms</a> and{" "}
                  <a href="#" style={{ color: C.primary, textDecoration: "none" }}>Privacy Policy</a>
                </p>
              </div>
            )}

            {step === 2 && (
              <form className="step-slide" onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Summary of step 1 */}
                <div style={{
                  padding: "10px 14px", borderRadius: 12, background: C.page,
                  border: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>{form.name}</div>
                    <div style={{ fontSize: 12, color: C.textSub }}>{form.email}</div>
                  </div>
                  <button type="button" onClick={() => { setStep(1); setError(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
                      color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                    }}>
                    <BackIcon /> Edit
                  </button>
                </div>

                <Field label="Password" type="password" name="password" value={form.password} onChange={change}
                  placeholder="Create a strong password" Icon={LockIcon} required />
                <Field label="Phone number (optional)" type="tel" name="phone" value={form.phone} onChange={change}
                  placeholder="+91 98765 43210" Icon={PhoneIcon} />

                {/* Password strength hint */}
                {form.password && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4].map(n => {
                      const strength = form.password.length >= n * 3 ? (n <= 2 ? "#F59E0B" : C.accent) : C.border;
                      return <div key={n} style={{ flex: 1, height: 3, borderRadius: 999, background: strength, transition: "background 180ms" }} />;
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", height: 50, borderRadius: 12, border: "none", marginTop: 4,
                    background: loading ? C.textMuted : `linear-gradient(135deg, ${C.primary} 0%, ${C.hover} 100%)`,
                    color: "#fff", fontWeight: 700, fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: loading ? "none" : "0 4px 16px rgba(15,61,46,0.25)",
                    transition: "all 120ms"
                  }}>
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
                  ) : "Create My Account 🎉"}
                </button>

                <button type="button" onClick={() => { setStep(1); setError(""); }}
                  style={{
                    width: "100%", height: 44, borderRadius: 12,
                    border: `1.5px solid ${C.border}`, background: "transparent",
                    color: C.textSub, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6, transition: "all 120ms"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
                >
                  <BackIcon /> Back
                </button>
              </form>
            )}

            <p style={{ textAlign: "center", marginTop: 20, color: C.textSub, fontSize: 14 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}
                onMouseEnter={e => e.target.style.textDecoration = "underline"}
                onMouseLeave={e => e.target.style.textDecoration = "none"}
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Trust pills */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginTop: 16, flexWrap: "wrap"
        }}>
          {[{ e: "🔒", t: "Secure & private" }, { e: "🚀", t: "Free to join" }, { e: "⭐", t: "4.8 rated" }].map(b => (
            <div key={b.t} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "8px 14px", borderRadius: 14, background: C.surface,
              border: `1px solid ${C.border}`, fontSize: 11, color: C.textSub
            }}>
              <span style={{ fontSize: 16 }}>{b.e}</span>
              <span style={{ fontWeight: 500 }}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}