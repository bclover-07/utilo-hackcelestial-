import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

export function getStoredSocketToken() {
  if (typeof window === "undefined") return null;
  return currentToken || localStorage.getItem("utlio_socket_token") || null;
}

export function setSocketAuthToken(token) {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("utlio_socket_token", token);
    } else {
      localStorage.removeItem("utlio_socket_token");
    }
  }

  if (socket) {
    socket.auth = { token };
    if (socket.io && socket.io.opts) {
      socket.io.opts.query = { token: token || "" };
    }
    if (!socket.connected && token) {
      socket.connect();
    }
  }
}

export function disconnectSocket() {
  setSocketAuthToken(null);
  if (socket) {
    socket.disconnect();
  }
}

export function getSocket() {
  if (typeof window === "undefined") return null;

  const token = getStoredSocketToken();

  if (!socket) {
    const origin =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (window.location.port === "3000"
        ? `${window.location.protocol}//${window.location.hostname}:4000`
        : window.location.origin);

    socket = io(origin, {
      withCredentials: true,
      autoConnect: true,
      auth: (cb) => {
        const t = getStoredSocketToken();
        cb({ token: t });
      },
      query: {
        token: token || "",
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server, ID:", socket.id);
    });

    socket.on("connect_error", async (err) => {
      console.warn("[Socket.io] Connection notice:", err.message);
      if (
        err.message?.toLowerCase().includes("auth") ||
        err.message?.toLowerCase().includes("token")
      ) {
        try {
          const res = await fetch("/api/auth/socket-token", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data?.token) {
              setSocketAuthToken(data.token);
              socket.connect();
            }
          }
        } catch {}
      }
    });
  } else {
    if (token && (!socket.auth?.token || socket.auth.token !== token)) {
      socket.auth = { token };
      if (socket.io && socket.io.opts) {
        socket.io.opts.query = { token };
      }
      if (!socket.connected) {
        socket.connect();
      }
    }
  }

  return socket;
}
