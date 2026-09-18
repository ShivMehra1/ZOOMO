export type LivePlace = {
  lat: number;
  lng: number;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

function pick(addr: Record<string, string | undefined>, keys: string[], fallback: string) {
  for (const k of keys) {
    if (addr[k]) return addr[k] as string;
  }
  return fallback;
}

export function getBrowserCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<LivePlace> {
  const fallback: LivePlace = {
    lat,
    lng,
    label: "Current location",
    street: "Current location",
    city: "Jourian",
    state: "Jammu",
    zipCode: "181202",
  };
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return fallback;
    const data = await res.json();
    const a = (data.address || {}) as Record<string, string | undefined>;
    const street = [a.house_number, a.road || a.neighbourhood || a.suburb].filter(Boolean).join(" ") || data.display_name?.split(",")[0] || "Current location";
    return {
      lat,
      lng,
      label: a.suburb || a.neighbourhood || a.village || a.town || a.city || "Current location",
      street,
      city: pick(a, ["city", "town", "village", "county"], "Jourian"),
      state: pick(a, ["state"], "Jammu"),
      zipCode: pick(a, ["postcode"], "181202"),
    };
  } catch {
    return fallback;
  }
}

export async function captureLivePlace(): Promise<LivePlace | null> {
  const coords = await getBrowserCoords();
  if (!coords) return null;
  return reverseGeocode(coords.lat, coords.lng);
}
