const TZ = "Asia/Kolkata";

function parts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  return d;
}

function sameDay(a, b) {
  const fmt = { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" };
  return a.toLocaleDateString("en-IN", fmt) === b.toLocaleDateString("en-IN", fmt);
}

export function formatTime(iso) {
  const d = parts(iso);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatWhen(iso, opts = {}) {
  const d = parts(iso);
  if (!d) return "—";
  const now = new Date();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const time = formatTime(iso);
  if (sameDay(d, now)) return `Today, ${time}`;
  if (sameDay(d, y)) return `Yesterday, ${time}`;
  return d.toLocaleString("en-IN", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...opts,
  });
}

export function formatWhenLong(iso) {
  const d = parts(iso);
  if (!d) return "—";
  return `${d.toLocaleString("en-IN", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} IST`;
}

export function formatClock(date = new Date()) {
  return date.toLocaleString("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function toLocalInput(d) {
  if (!d) return "";
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function rangePreset(key) {
  const now = new Date();
  if (key === "today") return { from: startOfDay(now), to: endOfDay(now) };
  if (key === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: startOfDay(y), to: endOfDay(y) };
  }
  if (key === "7d") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { from, to: endOfDay(now) };
  }
  if (key === "30d") {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 29);
    return { from, to: endOfDay(now) };
  }
  return { from: null, to: null };
}
