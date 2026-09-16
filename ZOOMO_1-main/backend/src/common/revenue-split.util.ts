/**
 * Delivery fee and revenue-split rules for the platform.
 *
 * Delivery fee — tiered percentage of the item subtotal (not the order
 * total), driver keeps 100% of this:
 *   subtotal < 100   -> 40%
 *   subtotal < 300   -> 25%
 *   subtotal < 1000  -> 20% (capped)
 *   subtotal >= 1000 -> free
 *
 * Item-price split (of `subtotal` only — delivery fee/tax/tip are separate):
 *   restaurant 70% / platform 25% / driver commission 5%
 */
export function computeDeliveryFee(subtotal: number): number {
  let rate: number;
  if (subtotal >= 1000) rate = 0;
  else if (subtotal >= 300) rate = 0.2;
  else if (subtotal >= 100) rate = 0.25;
  else rate = 0.4;
  return parseFloat((subtotal * rate).toFixed(2));
}

export type RevenueSplit = {
  restaurantEarning: number;
  platformFee: number;
  driverCommission: number;
};

export function computeRevenueSplit(subtotal: number): RevenueSplit {
  return {
    restaurantEarning: parseFloat((subtotal * 0.7).toFixed(2)),
    platformFee: parseFloat((subtotal * 0.25).toFixed(2)),
    driverCommission: parseFloat((subtotal * 0.05).toFixed(2)),
  };
}
