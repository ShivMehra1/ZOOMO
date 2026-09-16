import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ZoomoMark } from "./mark";
import { STAFF_ACCOUNTS, useZoomo, type StaffRole } from "@/lib/zoomo-store";

export function StaffShell({
  role,
  title,
  children,
}: {
  role: StaffRole;
  title: string;
  children: ReactNode;
}) {
  const nav = useNavigate();
  const { staff, staffLogin, staffLogout } = useZoomo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (!staff || staff.role !== role) {
    const demos = STAFF_ACCOUNTS.filter((a) => a.staff.role === role);
    return (
      <div className="min-h-screen bg-page px-5 py-10">
        <div className="mx-auto max-w-[420px]">
          <button onClick={() => nav({ to: "/portals" })} className="mb-8 flex items-center gap-2.5">
            <ZoomoMark size={36} />
            <span className="text-base font-bold text-ink">Zoomo Eats</span>
          </button>
          <p className="kicker mb-2">{title}</p>
          <h1 className="display mb-2 text-[32px] text-ink">Sign in</h1>
          <p className="mb-6 text-sm text-sub">Same Jourian backend the customer app talks to.</p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const s = staffLogin(email, password);
              if (!s || s.role !== role) setErr("Wrong login for this portal.");
              else setErr("");
            }}
          >
            {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{err}</p>}
            <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn-primary h-12 w-full">Continue</button>
          </form>
          <div className="mt-8 rounded-[22px] bg-surface p-4 shadow-card">
            <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Demo</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-sub">
              {demos.map((d) => (
                <li key={d.email}>
                  <button
                    type="button"
                    className="text-left font-semibold text-primary"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword(d.password);
                      staffLogin(d.email, d.password);
                    }}
                  >
                    {d.email}
                  </button>
                  <span className="text-muted"> · {d.password}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/portals" className="flex items-center gap-2.5">
            <ZoomoMark size={32} />
            <span>
              <span className="block text-[15px] font-bold text-ink">Zoomo Eats</span>
              <span className="block text-[10px] font-bold tracking-wide text-muted uppercase">{title}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-sub sm:block">{staff.name}</span>
            <button
              onClick={() => staffLogout()}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-bold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-16">{children}</div>
    </div>
  );
}
