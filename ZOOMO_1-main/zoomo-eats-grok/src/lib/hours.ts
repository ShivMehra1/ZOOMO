const TZ = "Asia/Kolkata";

/** Default Jourian kitchen window. Live `openingHours` overrides when present. */
export const SELL_OPEN = 10 * 60; // 10:00
export const SELL_CLOSE = 23 * 60; // 23:00
export const LAST_ORDER_MIN = 15; // stop taking orders 15 min before close

export function minutesNowIst(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return h * 60 + m;
}

export function parseHours(raw?: string | null): { open: number; close: number } {
  const m = String(raw || "").match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return { open: SELL_OPEN, close: SELL_CLOSE };
  return { open: Number(m[1]) * 60 + Number(m[2]), close: Number(m[3]) * 60 + Number(m[4]) };
}

function fmt(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const am = h < 12;
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${am ? "am" : "pm"}`;
}

export type SellState = {
  open: boolean;
  label: string;
  detail: string;
  closesInMin: number | null;
  opensAt: string;
  closesAt: string;
  lastOrderAt: string;
  ticks: string[];
};

export function sellState(openingHours?: string | null): SellState {
  const { open, close } = parseHours(openingHours);
  const now = minutesNowIst();
  const last = close - LAST_ORDER_MIN;
  const opensAt = fmt(open);
  const closesAt = fmt(close);
  const lastOrderAt = fmt(last);
  const ticks = [
    `Open ${opensAt} – ${closesAt} IST`,
    `Last order ${lastOrderAt}`,
    "Lunch 12:00 – 3:00 pm",
    "Evening 7:00 – 11:00 pm",
    "Delivery across Jourian",
  ];
  if (now >= open && now < last) {
    const closesInMin = last - now;
    const urgent = closesInMin <= 45;
    return {
      open: true,
      label: urgent ? `Last orders · ${closesInMin} min` : "Kitchens open now",
      detail: urgent ? `Order before ${lastOrderAt}` : `Until ${closesAt} · last order ${lastOrderAt}`,
      closesInMin,
      opensAt,
      closesAt,
      lastOrderAt,
      ticks,
    };
  }
  if (now >= last && now < close) {
    return {
      open: false,
      label: "Kitchen wrapping up",
      detail: `Last order was ${lastOrderAt}. Opens ${opensAt}.`,
      closesInMin: 0,
      opensAt,
      closesAt,
      lastOrderAt,
      ticks,
    };
  }
  return {
    open: false,
    label: `Opens ${opensAt}`,
    detail: `We sell ${opensAt} – ${closesAt} IST`,
    closesInMin: null,
    opensAt,
    closesAt,
    lastOrderAt,
    ticks,
  };
}

export function daypart(): "breakfast" | "lunch" | "evening" | "late" {
  const n = minutesNowIst();
  if (n < 11 * 60) return "breakfast";
  if (n < 16 * 60) return "lunch";
  if (n < 21 * 60) return "evening";
  return "late";
}
