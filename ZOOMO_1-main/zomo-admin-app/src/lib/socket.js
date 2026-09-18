import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.DEV ? "http://127.0.0.1:3000" : (import.meta.env.VITE_API_URL || "/backend");

let socket = null;

export function getAdminSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket", "polling"], autoConnect: true, path: "/socket.io" });
    socket.on("connect", () => socket.emit("join", { room: "admin" }));
  }
  return socket;
}
