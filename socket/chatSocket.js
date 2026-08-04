import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import {
  createChatMessage,
  getChatRecipient,
} from "../services/chatService.js";

const userRoom = (id) => `user:${id}`;
const safeAck = (ack, payload) => typeof ack === "function" && ack(payload);

export const initializeChatSocket = async (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    const subClient = pubClient.duplicate();
    pubClient.on("error", (error) =>
      console.error("Redis publisher error:", error.message),
    );
    subClient.on("error", (error) =>
      console.error("Redis subscriber error:", error.message),
    );
    io.adapter(
      createAdapter(pubClient, subClient, {
        publishOnSpecificResponseChannel: true,
      }),
    );
    console.log("Socket.IO Redis adapter enabled");
  } else {
    console.warn(
      "REDIS_URL is not configured; Socket.IO is running in single-instance mode.",
    );
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Authentication required.");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: decoded.id,
        status: "active",
        role: { $in: ["student", "teacher"] },
      }).select("name email role avatar");
      if (!user) throw new Error("Chat account is unavailable.");
      socket.user = user;
      next();
    } catch (error) {
      next(new Error(error.message || "Authentication failed."));
    }
  });

  io.on("connection", async (socket) => {
    const myId = String(socket.user._id);
    socket.join(userRoom(myId));
    io.emit("presence:update", { userId: myId, online: true });

    socket.on("presence:check", async ({ userIds = [] } = {}, ack) => {
      const onlineIds = [];
      for (const id of userIds.slice(0, 200)) {
        const sockets = await io.in(userRoom(id)).fetchSockets();
        if (sockets.length) onlineIds.push(String(id));
      }
      safeAck(ack, { ok: true, onlineIds });
    });

    socket.on("message:send", async ({ to, body } = {}, ack) => {
      try {
        const message = await createChatMessage(socket.user, to, body);
        io.to(userRoom(to)).to(userRoom(myId)).emit("message:new", message);
        safeAck(ack, { ok: true, message });
      } catch (error) {
        safeAck(ack, { ok: false, message: error.message });
      }
    });

    socket.on("message:read", async ({ from } = {}) => {
      await ChatMessage.updateMany(
        { sender: from, receiver: socket.user._id, readAt: null },
        { readAt: new Date() },
      );
      io.to(userRoom(from)).emit("message:read", { by: myId });
    });

    socket.on("typing", async ({ to, typing } = {}) => {
      try {
        await getChatRecipient(socket.user, to);
        io.to(userRoom(to)).emit("typing", {
          from: myId,
          typing: Boolean(typing),
        });
      } catch {}
    });

    for (const event of [
      "call:invite",
      "call:accept",
      "call:reject",
      "call:end",
      "webrtc:offer",
      "webrtc:answer",
      "webrtc:ice",
    ]) {
      socket.on(event, async ({ to, ...payload } = {}, ack) => {
        try {
          await getChatRecipient(socket.user, to);
          const sockets = await io.in(userRoom(to)).fetchSockets();
          if (!sockets.length) throw new Error("User is offline.");
          io.to(userRoom(to)).emit(event, {
            ...payload,
            from: myId,
            caller: {
              _id: myId,
              name: socket.user.name,
              avatar: socket.user.avatar,
            },
          });
          safeAck(ack, { ok: true });
        } catch (error) {
          safeAck(ack, { ok: false, message: error.message });
        }
      });
    }

    socket.on("disconnect", async () => {
      const sockets = await io.in(userRoom(myId)).fetchSockets();
      if (!sockets.length)
        io.emit("presence:update", { userId: myId, online: false });
    });
  });
  return io;
};
