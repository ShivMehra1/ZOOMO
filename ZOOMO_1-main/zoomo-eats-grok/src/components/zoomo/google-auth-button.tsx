import { useState } from "react";
import { X } from "lucide-react";
import { realGoogleAuth, type RealUser } from "@/lib/real-api";

// No GOOGLE_CLIENT_ID is configured anywhere in this project yet, so this
// button can't do a real Google sign-in. In dev mode it simulates "picking
// a Google account" by asking for a name, then calls the backend's
// find-or-create /auth/google endpoint with a synthesized email. Swapping
// in the real Google Identity Services SDK later means: replace this
// button's onClick with the GIS `renderButton`/`prompt` flow, get a real
// idToken, and pass it to realGoogleAuth (the backend already checks for
// GOOGLE_CLIENT_ID and will verify a real idToken once one is set).
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.73-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.94H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.27a12 12 0 0 0 0 10.8l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
    </svg>
  );
}

export function GoogleAuthButton({ onSuccess }: { onSuccess: (user: RealUser) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter a name to simulate a Google account.");
    setBusy(true);
    setErr("");
    try {
      const email = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")}@gmail.com`;
      const user = await realGoogleAuth(email, name.trim());
      setOpen(false);
      onSuccess(user);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-ghost flex h-12 w-full items-center justify-center gap-2.5 text-[15px]"
        >
          <GoogleGlyph />
          Continue with Google
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted">
          Demo mode — connect a real Google Client ID to go live
        </p>
      </div>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] bg-surface p-7 shadow-lift">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GoogleGlyph />
                <h2 className="text-base font-bold text-ink">Choose a Google account</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted">
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-4 text-[13px] leading-5 text-sub">
              No real Google account picker here — dev mode just needs a name to simulate one.
            </p>
            <form onSubmit={submit} className="space-y-3">
              {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{err}</p>}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="field !pl-4"
                autoFocus
              />
              <button type="submit" disabled={busy} className="btn-primary flex h-12 w-full items-center justify-center text-[15px]">
                {busy ? "Signing in…" : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
