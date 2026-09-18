/** Same-origin prefix so the browser never hits a foreign API (CORS). */
export const BACKEND_PROXY = "/backend";

export const LIVE_API = "https://zoomo-production.up.railway.app";

export function getApiBase(): string {
  const env =
    typeof import.meta !== "undefined"
      ? ((import.meta as any).env?.VITE_API_URL as string | undefined)
      : undefined;
  const isDev = Boolean((import.meta as any).env?.DEV);

  if (typeof window === "undefined") {
    if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, "");
    // SSR in Vite dev must hit the local Nest API, not production.
    if (isDev) return "http://127.0.0.1:3000";
    return LIVE_API;
  }

  // Vite dev / live preview: always the local proxy.
  if (isDev) return BACKEND_PROXY;
  return (env && /^https?:\/\//.test(env) ? env : LIVE_API).replace(/\/$/, "");
}

/** Seed / local DB rows still store http://localhost:3000/static/... */
export function publicMedia(url?: string | null, fallback = ""): string {
  if (!url) return fallback;
  const origin = typeof window === "undefined" ? getApiBase() : BACKEND_PROXY;
  let next = url.replace(/https?:\/\/(localhost|127\.0\.0\.1):\d+/g, origin);
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/backend") && !next.startsWith("/brand") && !next.startsWith("/__grok")) {
    next = `${origin}${next}`;
  }
  return next || fallback;
}
