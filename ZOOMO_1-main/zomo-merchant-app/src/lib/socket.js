import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// One socket connection for the whole app. Components join whichever rooms
// they care about (`restaurant:<id>`) and clean up on unmount.
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export function joinRoom(room) {
  if (!room) return;
  socket.emit("join", { room });
}

export function leaveRoom(room) {
  if (!room) return;
  socket.emit("leave", { room });
}
