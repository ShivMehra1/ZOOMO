/** Nest-compatible Zoomo API used by all four apps.
 *  Hits VITE_API_URL when set; otherwise the in-app platform store
 *  (same contracts as the Railway backend).
 */
import { DISHES, RESTAURANTS, RIDERS, restaurantById } from "./zoomo-data";
import { STAFF_ACCOUNTS, useZoomo } from "./zoomo-store";

const REMOTE = typeof import.meta !== "undefined" ? (import.meta.env.VITE_API_URL as string | undefined) : undefined;

async function remote(method: string, path: string, body?: unknown) {
  if (!REMOTE) return null;
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("access_token") : null;
  try {
    const res = await fetch(`${REMOTE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

export const api = {
  async login(email: string, password: string) {
    const hit = await remote("POST", "/auth/login", { email, password });
    if (hit?.access_token) {
      localStorage.setItem("access_token", hit.access_token);
      return hit;
    }
    const staff = useZoomo.getState().staffLogin(email, password);
    if (staff) return { access_token: "local", user: { ...staff, role: staff.role } };
    const row = STAFF_ACCOUNTS.find((a) => a.email === email.toLowerCase());
    if (row) return null;
    useZoomo.getState().login(email.split("@")[0], email);
    return { access_token: "local", user: { email, role: "USER" } };
  },

  restaurants: () => RESTAURANTS,
  restaurant: (id: string) => restaurantById(id),
  dishes: (restaurantId: string) => DISHES.filter((d) => d.restaurantId === restaurantId),
  riders: () => RIDERS,
};
