import { io } from "socket.io-client";

let socket = null;
let currentToken = null;
let isFetchingToken = false;

export function getStoredSocketToken() {
  if (typeof window === "undefined") return null;
  return (
    currentToken ||
    localStorage.getItem("utilo_socket_token") ||
    localStorage.getItem("utlio_socket_token") ||
    null
  );
}

export function setSocketAuthToken(token) {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("utilo_socket_token", token);
      localStorage.setItem("utlio_socket_token", token);
    } else {
      localStorage.removeItem("utilo_socket_token");
      localStorage.removeItem("utlio_socket_token");
    }
  }

  if (socket) {
    socket.auth = { token };
    if (socket.io && socket.io.opts) {
      socket.io.opts.query = { token: token || "" };
      socket.io.opts.extraHeaders = {
        ...(socket.io.opts.extraHeaders || {}),
        Authorization: token ? `Bearer ${token}` : "",
      };
    }
    if (token) {
      try {
        socket.disconnect();
      } catch {}
      socket.connect();
    }
  }
}

export function disconnectSocket() {
  setSocketAuthToken(null);
  if (socket) {
    try {
      socket.disconnect();
    } catch {}
  }
}

async function requestFreshSocketToken() {
  if (isFetchingToken || typeof window === "undefined") return null;
  isFetchingToken = true;
  try {
    const res = await fetch("/api/auth/socket-token", {
      credentials: "include",
      headers: { "X-Utilo-Request": "1", "X-Utlio-Request": "1" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.token) {
        setSocketAuthToken(data.token);
        return data.token;
      }
    }
  } catch (err) {
    console.warn("[Socket.io] Token retrieval notice:", err.message);
  } finally {
    isFetchingToken = false;
  }
  return null;
}

export function getSocket() {
  if (typeof window === "undefined") return null;

  const token = getStoredSocketToken();

  // If no token stored yet, trigger an immediate fetch
  if (!token && !isFetchingToken) {
    requestFreshSocketToken().then((freshToken) => {
      if (freshToken && socket && !socket.connected) {
        setSocketAuthToken(freshToken);
      }
    });
  }

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
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to server, ID:", socket.id);
    });

    socket.on("connect_error", async (err) => {
      const msg = err.message?.toLowerCase() || "";
      console.warn("[Socket.io] Connection notice:", err.message);
      if (
        msg.includes("auth") ||
        msg.includes("token") ||
        msg.includes("session") ||
        msg.includes("expired") ||
        msg.includes("jwt") ||
        msg.includes("unauthorized") ||
        msg.includes("invalid")
      ) {
        const freshToken = await requestFreshSocketToken();
        if (freshToken && socket) {
          socket.auth = { token: freshToken };
          if (socket.io && socket.io.opts) {
            socket.io.opts.query = { token: freshToken };
            socket.io.opts.extraHeaders = {
              ...(socket.io.opts.extraHeaders || {}),
              Authorization: `Bearer ${freshToken}`,
            };
          }
          try {
            socket.disconnect();
          } catch {}
          socket.connect();
        }
      }
    });
  } else {
    if (token && (!socket.auth?.token || socket.auth.token !== token)) {
      setSocketAuthToken(token);
    }
  }

  return socket;
}
