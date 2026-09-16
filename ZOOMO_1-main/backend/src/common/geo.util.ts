/**
 * Straight-line (haversine) distance between two lat/lng points, in km.
 * Used for driver-assignment distance display and ETA estimation — Jourian
 * (the seeded town) uses real Jammu-area coordinates, so this is a real
 * geographic calculation, not a mock number.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius, km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * ETA estimate from distance: a base kitchen-prep time plus ride time at an
 * assumed average town-riding speed (bikes/scooters in dense local streets,
 * not highway speed).
 */
const AVG_RIDING_SPEED_KMH = 18;
const BASE_PREP_MIN = 12;

export function estimateEtaMinutes(distanceKm: number): number {
  const rideMin = (distanceKm / AVG_RIDING_SPEED_KMH) * 60;
  return Math.round(BASE_PREP_MIN + rideMin);
}
