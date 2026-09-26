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

export function emitToUser(userId, event, payload) {
  if (ioInstance && userId) {
    ioInstance.to(`user_${String(userId)}`).emit(event, payload);
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

    // --- Video Calling & WebRTC Signaling ---
    // 1. Request Video Call
    socket.on("video_call_request", async ({ quoteId }, callback) => {
      try {
        if (!quoteId) {
          if (typeof callback === "function") callback({ error: "Quote ID required." });
          return;
        }

        const q = await Quote.findOne({
          _id: quoteId,
          $or: [{ provider: socket.user._id }, { seeker: socket.user._id }],
        })
          .populate("listing", "title")
          .populate("provider seeker", "name _id");

        if (!q) {
          if (typeof callback === "function") callback({ error: "Quote not found or unauthorized." });
          return;
        }

        const isCallerProvider = String(q.provider._id) === String(socket.user._id);
        const recipient = isCallerProvider ? q.seeker : q.provider;
        const roomId = `call_${quoteId}_${Date.now()}`;

        const m = await Message.create({
          quote: quoteId,
          sender: socket.user._id,
          text: `📹 Video call requested by ${socket.user.name}.`,
          type: "video_call",
          videoCall: {
            status: "requested",
            roomId,
            caller: socket.user._id,
            recipient: recipient._id,
          },
        });

        const populated = await Message.findById(m._id)
          .populate("sender", "name")
          .populate("videoCall.caller videoCall.recipient", "name")
          .lean();

        // Broadcast to quote room so chat updates with interactive card
        io.to(`quote_${quoteId}`).emit("new_message", populated);

        const incomingPayload = {
          quoteId: String(quoteId),
          roomId,
          messageId: String(m._id),
          listingTitle: q.listing?.title || "Resource Negotiation",
          caller: {
            _id: String(socket.user._id),
            name: socket.user.name,
          },
          recipientId: String(recipient._id),
          createdAt: new Date().toISOString(),
        };

        // Only send incoming call alert directly to target recipient's personal socket room
        io.to(`user_${recipient._id}`).emit("video_call_incoming", incomingPayload);

        // Create persistent notification record (emits 'notification' socket event)
        await notify(
          recipient._id,
          "📹 Incoming Video Call Request",
          `${socket.user.name} is requesting a live video call for "${q.listing?.title || 'Resource'}".`,
          `/dashboard/negotiations?selected=${quoteId}`,
        );

        if (typeof callback === "function") {
          callback({ success: true, roomId, messageId: String(m._id), message: populated });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    // 2. Accept Video Call
    socket.on("video_call_accept", async ({ quoteId, roomId, messageId }, callback) => {
      try {
        const q = await Quote.findOne({
          _id: quoteId,
          $or: [{ provider: socket.user._id }, { seeker: socket.user._id }],
        });

        if (!q) {
          if (typeof callback === "function") callback({ error: "Quote not found or unauthorized." });
          return;
        }

        if (messageId) {
          await Message.findByIdAndUpdate(messageId, {
            "videoCall.status": "accepted",
          });
        }

        const payload = {
          quoteId: String(quoteId),
          roomId,
          messageId,
          acceptedBy: {
            _id: String(socket.user._id),
            name: socket.user.name,
          },
        };

        io.to(`quote_${quoteId}`).emit("video_call_accepted", payload);
        const callerId = String(q.provider) === String(socket.user._id) ? String(q.seeker) : String(q.provider);
        io.to(`user_${callerId}`).emit("video_call_accepted", payload);

        if (typeof callback === "function") {
          callback({ success: true, payload });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    // 3. Decline Video Call
    socket.on("video_call_decline", async ({ quoteId, roomId, messageId, reason }, callback) => {
      try {
        const q = await Quote.findOne({
          _id: quoteId,
          $or: [{ provider: socket.user._id }, { seeker: socket.user._id }],
        });

        if (!q) {
          if (typeof callback === "function") callback({ error: "Quote not found." });
          return;
        }

        if (messageId) {
          await Message.findByIdAndUpdate(messageId, {
            "videoCall.status": "declined",
          });
        }

        const payload = {
          quoteId: String(quoteId),
          roomId,
          messageId,
          declinedBy: {
            _id: String(socket.user._id),
            name: socket.user.name,
          },
          reason: reason || "User is currently unavailable.",
        };

        io.to(`quote_${quoteId}`).emit("video_call_declined", payload);
        const callerId = String(q.provider) === String(socket.user._id) ? String(q.seeker) : String(q.provider);
        io.to(`user_${callerId}`).emit("video_call_declined", payload);

        if (typeof callback === "function") {
          callback({ success: true });
        }
      } catch (err) {
        if (typeof callback === "function") {
          callback({ error: err.message });
        }
      }
    });

    // 4. Relay WebRTC Signaling (Offer, Answer, ICE Candidate)
    socket.on("webrtc_signal", ({ quoteId, targetUserId, signal }) => {
      if (!targetUserId || !signal) return;
      io.to(`user_${targetUserId}`).emit("webrtc_signal", {
        quoteId,
        senderId: String(socket.user._id),
        signal,
      });
    });

    // 4b. WebRTC Peer Ready Handshake
    socket.on("webrtc_ready", ({ quoteId, targetUserId }) => {
      if (!targetUserId) return;
      io.to(`user_${targetUserId}`).emit("webrtc_ready", {
        quoteId,
        senderId: String(socket.user._id),
      });
    });

    // 5. End Video Call
    socket.on("video_call_end", async ({ quoteId, roomId, messageId, durationSeconds }, callback) => {
      try {
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, {
            "videoCall.status": "ended",
            "videoCall.durationSeconds": durationSeconds || 0,
          });
        }

        const payload = {
          quoteId: String(quoteId),
          roomId,
          messageId,
          durationSeconds: durationSeconds || 0,
          endedBy: {
            _id: String(socket.user._id),
            name: socket.user.name,
          },
        };

        io.to(`quote_${quoteId}`).emit("video_call_ended", payload);

        if (typeof callback === "function") {
          callback({ success: true });
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
