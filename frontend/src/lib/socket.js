import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const origin =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (window.location.port === "3000"
        ? "http://localhost:4000"
        : window.location.origin);

    socket = io(origin, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server, ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket.io] Connection warning:", err.message);
    });
  }

  return socket;
}
