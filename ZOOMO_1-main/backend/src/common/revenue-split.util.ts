/**
 * Order economics — delivery fee, tax, and the revenue split between
 * restaurant/platform/rider. All figures are derived from `subtotal` (the
 * food price only) unless noted.
 *
 * Delivery is only offered when the cart clears MIN_CART_FOR_DELIVERY and
 * the shop-to-drop distance is within MAX_DELIVERY_KM — beyond that the
 * customer must choose pickup or dine-in instead.
 *
 * Km slabs (delivery only, informational — the fee formula itself uses the
 * real km, not a slab-rounded value):
 *   0 to 2 km    -> "near"
 *   above 2-5 km -> "town"
 *   above 5-8 km -> "far"
 *   above 8 km   -> not offered
 *
 * Delivery fee = 6% of subtotal + ₹6 per km, rounded to the nearest rupee,
 * then clamped to [15, 50]. Pickup/dine-in: fee is always 0 (no slabs).
 *
 * Tax is 5% of subtotal only — never charged on the delivery fee or tip.
 *
 * Revenue split (of subtotal only):
 *   Delivery:        restaurant 80% / platform 15% / rider 5%
 *   Pickup/dine-in:   restaurant 95% / platform  0% / rider 5%
 * The delivery fee and the tip are separate from this split and go 100% to
 * the rider — the platform never takes a cut of either.
 */

export const MIN_CART_FOR_DELIVERY = 50;
export const MAX_DELIVERY_KM = 8;

export type KmSlab = "near" | "town" | "far";

export function resolveKmSlab(km: number): KmSlab | null {
  if (km <= 2) return "near";
  if (km <= 5) return "town";
  if (km <= 8) return "far";
  return null;
}

export function computeDeliveryFee(subtotal: number, km: number): number {
  const raw = subtotal * 0.06 + km * 6;
  const rounded = Math.round(raw);
  return Math.min(50, Math.max(15, rounded));
}

export function computeTax(subtotal: number): number {
  return parseFloat((subtotal * 0.05).toFixed(2));
}

export type OrderKind = "DELIVERY" | "PICKUP" | "DINE_IN";

export type RevenueSplit = {
  restaurantEarning: number;
  platformFee: number;
  driverCommission: number;
};

export function computeRevenueSplit(subtotal: number, orderType: OrderKind): RevenueSplit {
  const isDelivery = orderType === "DELIVERY";
  return {
    restaurantEarning: parseFloat((subtotal * (isDelivery ? 0.8 : 0.95)).toFixed(2)),
    platformFee: isDelivery ? parseFloat((subtotal * 0.15).toFixed(2)) : 0,
    driverCommission: parseFloat((subtotal * 0.05).toFixed(2)),
  };
}
