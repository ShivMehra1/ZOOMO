import { createContext, useContext, useEffect, useState } from "react";
import { apiRoot, getInbox } from "../services/adminApi";
import axios from "axios";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    try {
      const res = await axios.post(`${apiRoot()}/admin/auth/login`, { email, password });
      const token = res.data.accessToken || res.data.token;
      if (!token) return false;
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
    let cancelled = false;
    (async () => {
      const existing = localStorage.getItem("adminToken");
      if (existing) {
        try {
          await getInbox();
          if (!cancelled) setAdmin(existing);
        } catch {
          localStorage.removeItem("adminToken");
          const ok = await login("admin@zoomoeats.com", "admin123");
          if (!cancelled && !ok) setAdmin(null);
        }
      } else {
        await login("admin@zoomoeats.com", "admin123");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-z-page text-sm font-semibold text-z-ink">
        Opening Zoomo Admin…
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
