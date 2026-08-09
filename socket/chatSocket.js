import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import { createChatMessage, getChatRecipient } from "../services/chatService.js";

const userRoom = (id) => `user:${id}`;
const safeAck = (ack, payload) => typeof ack === "function" && ack(payload);

export const initializeChatSocket = async (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, { cors: { origin: allowedOrigins, credentials: true } });

  if (process.env.REDIS_URL) {
    let adapterActivated = false;
    let redisErrorLogged = false;
    const redisOptions = {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) =>
        adapterActivated ? Math.min(times * 200, 2000) : null,
    };
    const pubClient = new Redis(process.env.REDIS_URL, redisOptions);
    const subClient = pubClient.duplicate();
    const logRedisError = (role, error) => {
      if (redisErrorLogged) return;
      redisErrorLogged = true;
      const reason = error?.message || error?.code || error?.cause?.message || "Connection unavailable";
      console.warn(`Redis ${role} unavailable: ${reason}`);
    };
    pubClient.on("error", (error) => logRedisError("publisher", error));
    subClient.on("error", (error) => logRedisError("subscriber", error));

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      adapterActivated = true;
      io.adapter(createAdapter(pubClient, subClient, { publishOnSpecificResponseChannel: true }));
      console.log("Socket.IO Redis adapter enabled");
    } catch (error) {
      logRedisError("adapter", error);
      pubClient.disconnect();
      subClient.disconnect();
      console.warn("Socket.IO is running in single-instance mode because Redis is unavailable.");
    }
  } else {
    console.warn("REDIS_URL is not configured; Socket.IO is running in single-instance mode.");
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("Authentication required.");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.id, status: "active", role: { $in: ["student", "teacher"] } }).select("name email role avatar");
      if (!user) throw new Error("Chat account is unavailable.");
      socket.user = user;
      next();
    } catch (error) { next(new Error(error.message || "Authentication failed.")); }
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

    socket.on("message:send", async ({ to, body, attachment } = {}, ack) => {
      try {
        const message = await createChatMessage(socket.user, to, { body, attachment });
        io.to(userRoom(to)).to(userRoom(myId)).emit("message:new", message);
        safeAck(ack, { ok: true, message });
      } catch (error) { safeAck(ack, { ok: false, message: error.message }); }
    });

    socket.on("message:read", async ({ from } = {}) => {
      await ChatMessage.updateMany({ sender: from, receiver: socket.user._id, readAt: null }, { readAt: new Date() });
      io.to(userRoom(from)).emit("message:read", { by: myId });
    });

    socket.on("typing", async ({ to, typing } = {}) => {
      try { await getChatRecipient(socket.user, to); io.to(userRoom(to)).emit("typing", { from: myId, typing: Boolean(typing) }); } catch {}
    });

    for (const event of ["call:invite", "call:accept", "call:reject", "call:end", "webrtc:offer", "webrtc:answer", "webrtc:ice"]) {
      socket.on(event, async ({ to, ...payload } = {}, ack) => {
        try {
          await getChatRecipient(socket.user, to);
          const sockets = await io.in(userRoom(to)).fetchSockets();
          if (!sockets.length) throw new Error("User is offline.");
          io.to(userRoom(to)).emit(event, { ...payload, from: myId, caller: { _id: myId, name: socket.user.name, avatar: socket.user.avatar } });
          safeAck(ack, { ok: true });
        } catch (error) { safeAck(ack, { ok: false, message: error.message }); }
      });
    }

    socket.on("disconnect", async () => {
      const sockets = await io.in(userRoom(myId)).fetchSockets();
      if (!sockets.length) io.emit("presence:update", { userId: myId, online: false });
    });
  });
  return io;
};
