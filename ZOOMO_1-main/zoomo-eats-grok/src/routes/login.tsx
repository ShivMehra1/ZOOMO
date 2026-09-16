import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { ZoomoMark } from "@/components/zoomo/mark";
import { STAFF_ACCOUNTS, useZoomo } from "@/lib/zoomo-store";
import { IMG, PUNCHLINE, TOWN } from "@/lib/zoomo-data";
import { realLogin, realRequestOtp, realVerifyOtp } from "@/lib/real-api";
import { GoogleAuthButton } from "@/components/zoomo/google-auth-button";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const login = useZoomo((s) => s.login);
  const staffLogin = useZoomo((s) => s.staffLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setErr("Please enter your email.");
    if (!password) return setErr("Please enter your password.");
    const staffRow = STAFF_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (staffRow) {
      if (staffRow.password !== password) return setErr("Wrong password.");
      staffLogin(staffRow.email, staffRow.password);
      if (staffRow.staff.role === "MERCHANT") nav({ to: "/merchant" });
      else if (staffRow.staff.role === "DRIVER") nav({ to: "/driver" });
      else nav({ to: "/admin" });
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const user = await realLogin(email.trim(), password);
      login(user.name, user.email, user.phone ?? "", user.id);
      nav({ to: "/" });
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    const p = phone.replace(/\D/g, "");
    if (p.length !== 10) return setErr("Enter a valid 10-digit mobile.");
    if (!otpSent) {
      setBusy(true);
      setErr("");
      try {
        const { devCode } = await realRequestOtp(p);
        setDevCode(devCode);
        setOtpSent(true);
      } catch (err) {
        setErr(err instanceof Error ? err.message : "Could not send code.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (otp.length !== 4) return setErr("Enter the 4-digit code.");
    setBusy(true);
    setErr("");
    try {
      const user = await realVerifyOtp(p, otp);
      login(user.name, user.email, user.phone ?? "", user.id);
      nav({ to: "/" });
    } catch (err) {
      setErr(err instanceof Error ? err.message : "Incorrect code.");
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
            <h2 className="display max-w-sm text-4xl">Tonight in {TOWN}.</h2>
            <p className="mt-3 text-sm font-medium tracking-wide text-white/80">{PUNCHLINE}</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              One town. Restaurants in Jourian. We don’t deliver past the limits — that’s how food stays hot.
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
          <p className="kicker mb-2">Welcome back to {TOWN}</p>
          <h1 className="display mb-2 text-[32px] text-ink">Sign in</h1>
          <p className="mb-8 text-sm text-sub">Email or the mobile you used in Jourian.</p>

          <div className="mb-5">
            <GoogleAuthButton
              onSuccess={(user) => {
                login(user.name, user.email, user.phone ?? "", user.id);
                nav({ to: "/" });
              }}
            />
          </div>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-bold tracking-wide text-muted uppercase">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-full bg-sage p-1">
            <button type="button" onClick={() => { setTab("email"); setErr(""); }} className={`h-9 rounded-full text-[13px] font-bold ${tab === "email" ? "bg-white text-ink shadow-sm" : "text-sub"}`}>
              Email
            </button>
            <button type="button" onClick={() => { setTab("phone"); setErr(""); }} className={`h-9 rounded-full text-[13px] font-bold ${tab === "phone" ? "bg-white text-ink shadow-sm" : "text-sub"}`}>
              Phone
            </button>
          </div>

          {tab === "phone" ? (
            <form onSubmit={submitPhone} className="space-y-4">
              {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{err}</p>}
              {otpSent ? (
                <>
                  <p className="text-[13px] text-sub">Code sent to +91 {phone}.</p>
                  {devCode && (
                    <p className="rounded-xl bg-sage px-3 py-2 text-[13px] font-medium text-primary">
                      Dev mode — no SMS provider connected, your code is <span className="font-bold tracking-widest">{devCode}</span>
                    </p>
                  )}
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" inputMode="numeric" className="field !pl-4 tracking-[0.4em]" />
                  <button type="submit" disabled={busy} className="btn-primary flex h-12 w-full items-center justify-center text-[15px]">
                    {busy ? "Checking…" : "Verify"}
                  </button>
                </>
              ) : (
                <>
                  <label className="block text-[13px] font-medium text-sub">Mobile</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" inputMode="numeric" className="field !pl-4" />
                  <button type="submit" disabled={busy} className="btn-primary flex h-12 w-full items-center justify-center text-[15px]">
                    {busy ? "Sending…" : "Send OTP"}
                  </button>
                </>
              )}
            </form>
          ) : (
          <form onSubmit={submit} className="space-y-4">
            {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{err}</p>}
            <label className="block text-[13px] font-medium text-sub">Email</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-sub">Password</label>
              <span className="text-xs font-bold text-primary">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field pr-10"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button type="submit" disabled={busy} className="btn-primary flex h-12 w-full items-center justify-center text-[15px]">
              {busy ? "Signing in…" : "Continue"}
            </button>
          </form>
          )}
          <p className="mt-6 text-center text-sm text-sub">
            New here?{" "}
            <Link to="/signup" className="font-bold text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
