import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { ZoomoMark } from "@/components/zoomo/mark";
import { IMG, PUNCHLINE, TOWN } from "@/lib/zoomo-data";
import { useZoomo } from "@/lib/zoomo-store";
import { realSignup } from "@/lib/real-api";
import { GoogleAuthButton } from "@/components/zoomo/google-auth-button";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const nav = useNavigate();
  const login = useZoomo((s) => s.login);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = Math.min(4, Math.floor(password.length / 3));

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Please enter your full name.");
    if (!email.trim()) return setErr("Please enter your email.");
    const p = phone.replace(/\D/g, "");
    if (p && p.length !== 10) return setErr("Enter a valid 10-digit mobile number.");
    setErr("");
    setStep(2);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    setErr("");
    try {
      const user = await realSignup({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.replace(/\D/g, "").slice(-10),
      });
      login(user.name, user.email, user.phone ?? "", user.id);
      nav({ to: "/" });
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary md:block">
        <img src={IMG.hero} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <button onClick={() => nav({ to: "/" })} className="flex items-center gap-3">
            <ZoomoMark size={44} onGreen />
            <span className="text-lg font-bold tracking-tight">Zoomo Eats</span>
          </button>
          <div>
            <h2 className="display max-w-sm text-4xl">Sit down in {TOWN}.</h2>
            <p className="mt-3 text-sm font-medium tracking-wide text-white/80">{PUNCHLINE}</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              One town. Restaurants in Jourian. We don’t leave the limits — that’s how food stays hot.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-page px-5 py-12">
        <div className="w-full max-w-[400px]">
          <button onClick={() => nav({ to: "/" })} className="mb-8 flex items-center gap-2.5 md:hidden">
            <ZoomoMark size={36} />
            <span className="text-base font-bold text-ink">Zoomo Eats</span>
          </button>
          <p className="kicker mb-2">Step {step} of 2</p>
          <h1 className="display mb-2 text-[32px] text-ink">{step === 1 ? "Create account" : "Set a password"}</h1>
          <p className="mb-8 text-sm text-sub">
            {step === 1 ? "Name, email, and a mobile we can reach you on." : "At least 6 characters. Stored only on this device."}
          </p>
          {step === 1 && (
            <>
              <GoogleAuthButton
                onSuccess={(user) => {
                  login(user.name, user.email, user.phone ?? "", user.id);
                  nav({ to: "/" });
                }}
              />
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[11px] font-bold tracking-wide text-muted uppercase">or</span>
                <div className="h-px flex-1 bg-line" />
              </div>
            </>
          )}
          <form onSubmit={step === 1 ? next : create} className="space-y-4">
            {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{err}</p>}
            {step === 1 ? (
              <>
                <label className="block text-[13px] font-medium text-sub">Full name</label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field" />
                </div>
                <label className="block text-[13px] font-medium text-sub">Email</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
                </div>
                <label className="block text-[13px] font-medium text-sub">Phone</label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                  <input
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))}
                    placeholder="10-digit mobile"
                    className="field"
                    maxLength={10}
                  />
                </div>
                <button type="submit" className="btn-primary h-12 w-full text-[15px]">
                  Continue
                </button>
              </>
            ) : (
              <>
                <label className="block text-[13px] font-medium text-sub">Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="field pr-10"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((x) => (
                    <div
                      key={x}
                      className={`h-1.5 flex-1 rounded-full ${strength >= x ? "bg-primary" : "bg-line"}`}
                    />
                  ))}
                </div>
                <button type="submit" disabled={busy} className="btn-primary h-12 w-full text-[15px]">
                  {busy ? "Creating…" : "Create account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErr("");
                  }}
                  className="btn-ghost flex h-11 w-full items-center justify-center gap-1 text-sm"
                >
                  <ChevronLeft className="size-4" /> Back
                </button>
              </>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-sub">
            Already here?{" "}
            <Link to="/login" className="font-bold text-primary">
              Sign in
            </Link>
          </p>
          {step === 1 && (
            <p className="mt-2 text-center text-sm text-sub">
              Prefer mobile OTP?{" "}
              <Link to="/login" className="font-bold text-primary">
                Sign up with your phone
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
