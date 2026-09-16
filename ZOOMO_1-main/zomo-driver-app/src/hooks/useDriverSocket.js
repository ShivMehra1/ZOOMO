import { useEffect } from "react";
import { socket, joinRoom, leaveRoom } from "../lib/socket";
import { useDriverAuth } from "../context/DriverAuthContext";

/**
 * Joins this driver's own room (`driver:<id>`) for the lifetime of the
 * session, so any screen can subscribe to `order:updated` / `order:message`
 * / `payout:updated` via `socket.on(...)` without re-joining per page.
 */
export function useDriverSocket() {
  const { driver } = useDriverAuth();
  const driverId = driver?.id;

  useEffect(() => {
    if (!driverId) return;
    const room = `driver:${driverId}`;
    joinRoom(room);
    return () => leaveRoom(room);
  }, [driverId]);

  return socket;
}

/** Join/leave a specific order's room for the lifetime of a component (e.g. the active-delivery screen). */
export function useOrderRoom(orderId) {
  useEffect(() => {
    if (!orderId) return;
    const room = `order:${orderId}`;
    joinRoom(room);
    return () => leaveRoom(room);
  }, [orderId]);
}
