import { io } from "socket.io-client";

// One shared connection for the whole app — joins the platform-wide "admin"
// room so every page gets order/payout events live instead of polling.
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socket = null;

export function getAdminSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"], autoConnect: true });
    socket.on("connect", () => socket.emit("join", { room: "admin" }));
  }
  return socket;
}
