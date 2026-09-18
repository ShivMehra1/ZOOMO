import { io } from "socket.io-client";

const API_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:3000"
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "");

// Singleton — one live connection for the whole app, rooms are joined
// per-screen via `join`/`leave` as the driver navigates around.
export const socket = io(API_BASE, {
  autoConnect: true,
  transports: ["websocket"],
});

export function joinRoom(room) {
  if (!room) return;
  socket.emit("join", { room });
}

export function leaveRoom(room) {
  if (!room) return;
  socket.emit("leave", { room });
}
