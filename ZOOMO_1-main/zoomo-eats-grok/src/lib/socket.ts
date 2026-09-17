import { io, type Socket } from "socket.io-client";
import { getApiBase } from "./api-base";

let socket: Socket | null = null;

/** Lazily-created singleton connection to the backend's realtime gateway. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(getApiBase(), { transports: ["websocket", "polling"], autoConnect: true });
  }
  return socket;
}

export function joinRoom(room: string) {
  getSocket().emit("join", { room });
}

export function leaveRoom(room: string) {
  getSocket().emit("leave", { room });
}
