import axios from "axios";

function apiRoot() {
  if (import.meta.env.DEV) return "/backend";
  return (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: apiRoot(),
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("zomo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
