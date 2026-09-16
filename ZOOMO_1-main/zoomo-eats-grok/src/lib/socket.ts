import { io, type Socket } from "socket.io-client";

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:3000";

let socket: Socket | null = null;

/** Lazily-created singleton connection to the backend's realtime gateway. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}

export function joinRoom(room: string) {
  getSocket().emit("join", { room });
}

export function leaveRoom(room: string) {
  getSocket().emit("leave", { room });
}
