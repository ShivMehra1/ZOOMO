import axios from "axios";

export function apiRoot() {
  // Dev: always same-origin Vite proxy so CORS cannot blank the UI.
  if (import.meta.env.DEV) return "/backend";
  const env = import.meta.env.VITE_API_URL;
  return (env && /^https?:\/\//.test(env) ? env : "/backend").replace(/\/$/, "");
}

const adminApi = axios.create({
  baseURL: `${apiRoot()}/admin`,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (config.method && config.method.toLowerCase() !== "get" && config.method.toLowerCase() !== "head") {
    config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(err);
  },
);

export default adminApi;

export const getInbox = () => adminApi.get("/analytics/inbox");

export const assignDriver = (orderId, driverId) =>
  adminApi.patch(`/orders/${orderId}/assign-driver`, { driverId });
export const getOrders = (params) =>
  adminApi.get("/orders", { params: typeof params === "string" ? { restaurantId: params } : params });
export const deleteOrder = (orderId) => adminApi.delete(`/orders/${orderId}`);
export const updateOrderStatus = (orderId, status) =>
  adminApi.patch(`/orders/${orderId}/status`, { status });
export const getNearestDrivers = (orderId) => adminApi.get(`/orders/${orderId}/nearest-drivers`);
export const getDisputes = () => adminApi.get("/orders/disputes");
export const refundOrder = (orderId, amount, reason) =>
  adminApi.patch(`/orders/${orderId}/refund`, { amount, reason });
export const rejectRefund = (orderId) => adminApi.patch(`/orders/${orderId}/refund-reject`);
export const getOrderMessages = (orderId) => adminApi.get(`/orders/${orderId}/messages`);

export const getUsers = (search, role) => adminApi.get("/users", { params: { search, role } });
export const getUserById = (id) => adminApi.get(`/users/${id}`);
export const createUser = (data) => adminApi.post("/users", data);
export const updateUser = (id, data) => adminApi.patch(`/users/${id}`, data);
export const suspendUser = (id, reason) => adminApi.patch(`/users/${id}/suspend`, { reason });
export const unsuspendUser = (id) => adminApi.patch(`/users/${id}/unsuspend`);
export const resetUserPassword = (id) => adminApi.post(`/users/${id}/reset-password`);
export const deleteUser = (id) => adminApi.delete(`/users/${id}`);
export const purgeSeed = () => adminApi.post("/users/purge-seed");

export const getDrivers = () => adminApi.get("/drivers");
export const getDriverById = (id) => adminApi.get(`/drivers/${id}`);
export const createDriver = (data) => adminApi.post("/drivers", data);
export const updateDriver = (id, data) => adminApi.patch(`/drivers/${id}`, data);
export const deleteDriver = (id) => adminApi.delete(`/drivers/${id}`);

export const getRestaurants = (search) => adminApi.get("/restaurants", { params: { search } });
export const getRestaurantById = (id) => adminApi.get(`/restaurants/${id}`);
export const createRestaurant = (data) => adminApi.post("/restaurants", data);
export const approveRestaurant = (id) => adminApi.patch(`/restaurants/${id}/approve`);
export const rejectRestaurant = (id) => adminApi.patch(`/restaurants/${id}/reject`);
export const toggleRestaurantActive = (id, isActive) =>
  adminApi.patch(`/restaurants/${id}/active`, { isActive });
export const updateRestaurant = (id, data) => adminApi.patch(`/restaurants/${id}`, data);
export const createDish = (restaurantId, data) => adminApi.post(`/restaurants/${restaurantId}/dishes`, data);
export const updateDish = (restaurantId, dishId, data) =>
  adminApi.patch(`/restaurants/${restaurantId}/dishes/${dishId}`, data);
export const deleteDish = (restaurantId, dishId) =>
  adminApi.delete(`/restaurants/${restaurantId}/dishes/${dishId}`);
export const deleteRestaurant = (id) => adminApi.delete(`/restaurants/${id}`);

export const getAnalyticsSummary = () => adminApi.get("/analytics/summary");
export const getRevenueTimeseries = (days = 14) =>
  adminApi.get("/analytics/revenue-timeseries", { params: { days } });
export const getTopRestaurants = (limit = 5) =>
  adminApi.get("/analytics/top-restaurants", { params: { limit } });
export const getTopDishes = (limit = 5) =>
  adminApi.get("/analytics/top-dishes", { params: { limit } });

export const getBusinessSummary = () => adminApi.get("/payouts/summary");
export const getPayouts = () => adminApi.get("/payouts");
export const approvePayout = (id) => adminApi.patch(`/payouts/${id}/approve`);
export const rejectPayout = (id) => adminApi.patch(`/payouts/${id}/reject`);
export const markPayoutPaid = (id) => adminApi.patch(`/payouts/${id}/paid`);
export const uploadPayoutProof = (id, url) => adminApi.post(`/payouts/${id}/proof`, { url });

export const getPromotions = () => adminApi.get("/promotions");
export const createPromotion = (data) => adminApi.post("/promotions", data);
export const updatePromotion = (id, data) => adminApi.patch(`/promotions/${id}`, data);
export const deletePromotion = (id) => adminApi.delete(`/promotions/${id}`);
export const getRainSurge = () => adminApi.get("/settings/rain-surge");
export const setRainSurge = (on, pct) => adminApi.post("/settings/rain-surge", { on, pct });

export async function uploadImage(file, folder = "restaurants") {
  const form = new FormData();
  form.append("file", file);
  const res = await adminApi.post(`/upload/image?folder=${encodeURIComponent(folder)}`, form);
  return res.data;
}
