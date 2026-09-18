import { createContext, useContext, useEffect, useState } from "react";
import { getInbox } from "../services/adminApi";
import { getAdminSocket } from "../lib/socket";
import { useAdminAuth } from "./AdminAuthContext";

const AdminInboxContext = createContext({
  unreadOrders: 0,
  unreadPayouts: 0,
  disputes: 0,
  refunds: 0,
});

export function AdminInboxProvider({ children }) {
  const { admin } = useAdminAuth();
  const [inbox, setInbox] = useState({ unreadOrders: 0, unreadPayouts: 0, disputes: 0, refunds: 0 });

  async function refresh() {
    try {
      const res = await getInbox();
      setInbox(res.data || inbox);
    } catch {
      /* stay on last counts */
    }
  }

  useEffect(() => {
    if (!admin) return;
    refresh();
    const t = setInterval(refresh, 15000);
    let socket;
    try {
      socket = getAdminSocket();
      socket.on("order:created", refresh);
      socket.on("order:updated", refresh);
      socket.on("payout:requested", refresh);
      socket.on("payout:updated", refresh);
    } catch {
      socket = null;
    }
    return () => {
      clearInterval(t);
      if (!socket) return;
      socket.off("order:created", refresh);
      socket.off("order:updated", refresh);
      socket.off("payout:requested", refresh);
      socket.off("payout:updated", refresh);
    };
  }, [admin]);

  return <AdminInboxContext.Provider value={inbox}>{children}</AdminInboxContext.Provider>;
}

export function useAdminInbox() {
  return useContext(AdminInboxContext);
}
