const TZ = "Asia/Kolkata";

function valid(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(+d) ? null : d;
}

function sameDay(a, b) {
  const fmt = { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" };
  return a.toLocaleDateString("en-IN", fmt) === b.toLocaleDateString("en-IN", fmt);
}

export function formatTime(iso) {
  const d = valid(iso);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatWhen(iso) {
  const d = valid(iso);
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
