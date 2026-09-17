/**
 * LEGACY — do not add new codes here.
 *
 * Promo codes live in Postgres (`Promotion`). Checkout quote/place and
 * GET /offers read that table. `scripts/seed-platform.ts` seeds the
 * platform codes (ZOOMO50, FREESHIP, NEWUSER) plus BOGO at I Love Pizza.
 *
 * Kept so any leftover import does not crash the build.
 */
export const PROMO_CODES: Record<
  string,
  { type: "percent" | "flat" | "ship"; value: number; max?: number }
> = {};

export const OFFERS: Array<{
  code: string;
  title: string;
  subtitle: string;
  expires: string;
  restaurantId: string | null;
}> = [];
