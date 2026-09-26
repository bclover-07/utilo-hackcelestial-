import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { BusinessProfile, Quote, Message } from "./models/index.js";
import { isAllowedOrigin } from "./middlewares/auth.js";
import { notify } from "./services/notificationService.js";

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function broadcastMessage(quoteId, message) {
  if (ioInstance) {
    ioInstance.to(`quote_${quoteId}`).emit("new_message", message);
  }
}

export function initSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Origin not allowed by Socket.io"), false);
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookieMatch = cookieHeader.match(/utlio_session=([^;]+)/);
      const token =
        socket.handshake.auth?.token || (cookieMatch ? cookieMatch[1] : null);

      if (!token) {
        return next(new Error("Authentication token required for Socket.io"));
      }

      const payload = jwt.verify(token, config.jwt, {
        algorithms: ["HS256"],
        issuer: "utlio",
        audience: "utlio-web",
      });

      const user = await BusinessProfile.findById(payload.sub);
      if (!user || user.sessionVersion !== payload.version) {
        return next(new Error("Invalid or expired session"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Socket authentication failed: ${err.message}`));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user_${userId}`);

    // Join quote discussion room
    socket.on("join_quote", async (quoteId) => {
      try {
        if (!quoteId) return;
        const q = await Quote.findOne({
          _id: quoteId,
          $or: [{ provider: socket.user._id }, { seeker: socket.user._id }],
        });
        if (q) {
          socket.join(`quote_${quoteId}`);
          socket.emit("joined_quote", { quoteId, status: "success" });
        } else {
          socket.emit("error", { message: "Quote not found or unauthorized" });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // Leave quote room
    socket.on("leave_quote", (quoteId) => {
      if (quoteId) {
        socket.leave(`quote_${quoteId}`);
      }
    });

    // Send real-time chat message over socket
    socket.on("send_message", async ({ quoteId, text }, callback) => {
      try {
        const cleanText = typeof text === "string" ? text.trim() : "";
        if (!cleanText || cleanText.length > 4000) {
          if (typeof callback === "function") callback({ error: "Invalid message text." });
          return;
        }

        const q = await Quote.findOne({
          _id: quoteId,
          $or: [{ provider: socket.user._id }, { seeker: socket.user._id }],
        });
        if (!q) {
          if (typeof callback === "function") callback({ error: "Quote not found or unauthorized." });
          return;
        }

        const m = await Message.create({
          quote: quoteId,
          sender: socket.user._id,
          text: cleanText,
        });

        const populated = await Message.findById(m._id)
          .populate("sender", "name")
          .lean();

        io.to(`quote_${quoteId}`).emit("new_message", populated);

        await notify(
          String(q.provider) === String(socket.user._id) ? q.seeker : q.provider,
          "New message",
          "Your booking partner sent a message.",
          "/dashboard/negotiations",
        );

        if (typeof callback === "function") {
          callback({ success: true, message: populated });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
}
