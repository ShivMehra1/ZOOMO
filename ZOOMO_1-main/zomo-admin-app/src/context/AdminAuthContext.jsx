import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AdminAuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "/backend";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    try {
      const res = await axios.post(`${API}/admin/auth/login`, { email, password });
      const token = res.data.accessToken;
      localStorage.setItem("adminToken", token);
      setAdmin(token);
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem("adminToken");
    setAdmin(null);
  }

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAdmin(token);
      setLoading(false);
      return;
    }
    login("admin@zoomoeats.com", "admin123").finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-z-page text-sm font-semibold text-z-ink">
        Opening Zoomo HQ…
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
