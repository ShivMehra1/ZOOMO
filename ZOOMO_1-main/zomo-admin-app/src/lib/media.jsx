const BACKEND = "/backend";

export function mediaUrl(url, fallback = "") {
  if (!url) return fallback;
  let next = String(url);
  next = next.replace(/https?:\/\/(localhost|127\.0\.0\.1):\d+/g, BACKEND);
  if (next.startsWith("/static")) next = `${BACKEND}${next}`;
  return next || fallback;
}

export function RestaurantThumb({ url, alt = "" }) {
  const src = mediaUrl(url);
  if (!src) {
    return <div className="size-16 shrink-0 rounded-xl bg-z-page border border-z-line" />;
  }
  return <img src={src} alt={alt} className="size-16 shrink-0 rounded-xl object-cover bg-z-page" />;
}
