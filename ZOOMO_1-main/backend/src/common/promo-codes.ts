export const PROMO_CODES: Record<
  string,
  { type: "percent" | "flat" | "ship"; value: number; max?: number }
> = {
  ZOOMO50: { type: "percent", value: 50, max: 100 },
  BOGO: { type: "flat", value: 60 },
  FREESHIP: { type: "ship", value: 29 },
  HEALTHY20: { type: "percent", value: 20, max: 80 },
  NEWUSER: { type: "flat", value: 80 },
};

export const OFFERS = [
  {
    code: "ZOOMO50",
    title: "50% off your first bag",
    subtitle: "Capped at ₹100. One-time use.",
    expires: "This week",
    restaurantId: null as string | null,
  },
  {
    code: "BOGO",
    title: "₹60 off any pizza order",
    subtitle: "Works at every pizza kitchen.",
    expires: "This week",
    restaurantId: null as string | null,
  },
  {
    code: "FREESHIP",
    title: "Ride on us",
    subtitle: "Delivery fee waived.",
    expires: "Always on",
    restaurantId: null as string | null,
  },
  {
    code: "HEALTHY20",
    title: "20% off healthy picks",
    subtitle: "Bowls, smoothies and salads.",
    expires: "Weekdays",
    restaurantId: null as string | null,
  },
  {
    code: "NEWUSER",
    title: "₹80 off your first order",
    subtitle: "New here? This one's on us.",
    expires: "Always on",
    restaurantId: null as string | null,
  },
];
