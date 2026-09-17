import axios from 'axios';

const adminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin`,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminApi;

export const assignDriver = (orderId, driverId) =>
  adminApi.patch(`/orders/${orderId}/assign-driver`, { driverId });

export const getOrders = (restaurantId) => adminApi.get('/orders', { params: { restaurantId } });
export const deleteOrder = (orderId) => adminApi.delete(`/orders/${orderId}`);
export const getDrivers = () => adminApi.get('/drivers');
export const getDriverById = (id) => adminApi.get(`/drivers/${id}`);

// ✅ NEW — update order status (used for scheduled order force confirm / cancel)
export const updateOrderStatus = (orderId, status) =>
  adminApi.patch(`/orders/${orderId}/status`, { status });

// ── Users ──
export const getUsers = (search, role) =>
  adminApi.get('/users', { params: { search, role } });
export const getUserById = (id) => adminApi.get(`/users/${id}`);
export const updateUser = (id, data) => adminApi.patch(`/users/${id}`, data);
export const suspendUser = (id, reason) => adminApi.patch(`/users/${id}/suspend`, { reason });
export const unsuspendUser = (id) => adminApi.patch(`/users/${id}/unsuspend`);
export const resetUserPassword = (id) => adminApi.post(`/users/${id}/reset-password`);

// ── Restaurants ──
export const getRestaurants = (search) =>
  adminApi.get('/restaurants', { params: { search } });
export const getRestaurantById = (id) => adminApi.get(`/restaurants/${id}`);
export const approveRestaurant = (id) => adminApi.patch(`/restaurants/${id}/approve`);
export const rejectRestaurant = (id) => adminApi.patch(`/restaurants/${id}/reject`);
export const toggleRestaurantActive = (id, isActive) =>
  adminApi.patch(`/restaurants/${id}/active`, { isActive });
export const updateRestaurant = (id, data) => adminApi.patch(`/restaurants/${id}`, data);
export const updateDish = (restaurantId, dishId, data) =>
  adminApi.patch(`/restaurants/${restaurantId}/dishes/${dishId}`, data);
export const deleteDish = (restaurantId, dishId) =>
  adminApi.delete(`/restaurants/${restaurantId}/dishes/${dishId}`);

// ── Analytics ──
export const getAnalyticsSummary = () => adminApi.get('/analytics/summary');
export const getRevenueTimeseries = (days = 14) =>
  adminApi.get('/analytics/revenue-timeseries', { params: { days } });
export const getTopRestaurants = (limit = 5) =>
  adminApi.get('/analytics/top-restaurants', { params: { limit } });
export const getTopDishes = (limit = 5) =>
  adminApi.get('/analytics/top-dishes', { params: { limit } });

// ── Disputes & refunds ──
export const getDisputes = () => adminApi.get('/orders/disputes');
export const refundOrder = (orderId, amount, reason) =>
  adminApi.patch(`/orders/${orderId}/refund`, { amount, reason });
export const getOrderMessages = (orderId) => adminApi.get(`/orders/${orderId}/messages`);

// ── Finance / payouts ──
export const getBusinessSummary = () => adminApi.get('/payouts/summary');
export const getPayouts = () => adminApi.get('/payouts');
export const approvePayout = (id) => adminApi.patch(`/payouts/${id}/approve`);
export const rejectPayout = (id) => adminApi.patch(`/payouts/${id}/reject`);

// ── Geo: nearest available drivers for an order ──
export const getNearestDrivers = (orderId) => adminApi.get(`/orders/${orderId}/nearest-drivers`);