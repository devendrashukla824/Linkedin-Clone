import type { ClientToServerEvents, ServerToClientEvents } from "@linkedin-clone/shared";
import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "#src/config/env.js";
import { MessageUseCases } from "#src/application/messages/message-use-cases.js";
import { MongoMessageRepository } from "#src/infrastructure/repositories/mongo-message-repository.js";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { JwtService } from "#src/infrastructure/services/jwt-service.js";
import { registerNotificationSocketServer, userRoom } from "#src/interfaces/realtime/notification-bus.js";

interface SocketData {
  userId: string;
}

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const onlineUsers = new Map<string, Set<string>>();

export function createSocketServer(httpServer: HttpServer) {
  const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true
    }
  });
  registerNotificationSocketServer(io);
  const jwtService = new JwtService();
  const users = new MongoUserRepository();
  const messages = new MessageUseCases(new MongoMessageRepository(), users);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token || typeof token !== "string") {
        next(new Error("Authentication required"));
        return;
      }

      const payload = jwtService.verify(token);
      const user = await users.findById(payload.userId);
      if (!user) {
        next(new Error("Authentication required"));
        return;
      }

      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });

  io.on("connection", (socket: ChatSocket) => {
    const userId = socket.data.userId;
    socket.join(userRoom(userId));
    setOnline(userId, socket.id);
    socket.broadcast.emit("presence:update", { userId, isOnline: true });

    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        await messages.listMessages(conversationId, userId);
        socket.join(conversationRoom(conversationId));
      } catch {
        socket.emit("notification:new", {
          id: `socket-error:${Date.now()}`,
          recipientId: userId,
          actor: { id: userId, name: "ProNet", headline: "System" },
          type: "system",
          title: "Conversation access denied",
          body: "You do not have access to this conversation.",
          entityId: conversationId,
          entityType: "message",
          href: "/messages",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    socket.on("message:send", async (payload, callback) => {
      try {
        const message = await messages.sendMessage({
          conversationId: payload.conversationId,
          senderId: userId,
          receiverId: payload.receiverId,
          body: payload.body
        });

        io.to(userRoom(payload.receiverId)).emit("message:new", message);
        io.to(userRoom(userId)).emit("message:new", message);
        io.to(conversationRoom(message.conversationId)).emit("message:new", message);
        callback({ success: true, message });
      } catch (error) {
        callback({ success: false, error: error instanceof Error ? error.message : "Could not send message" });
      }
    });

    socket.on("message:seen", async ({ conversationId, messageIds }) => {
      try {
        const seen = await messages.markSeen(conversationId, userId, messageIds.slice(0, 100));
        io.to(conversationRoom(conversationId)).emit("message:seen", seen);
      } catch {
        socket.emit("notification:new", {
          id: `socket-error:${Date.now()}`,
          recipientId: userId,
          actor: { id: userId, name: "ProNet", headline: "System" },
          type: "system",
          title: "Could not mark messages seen",
          body: "The conversation could not be updated.",
          entityId: conversationId,
          entityType: "message",
          href: "/messages",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    socket.on("typing:update", ({ conversationId, receiverId, isTyping }) => {
      if (receiverId !== userId) {
        io.to(userRoom(receiverId)).emit("typing:update", { conversationId, userId, isTyping });
      }
    });

    socket.on("disconnect", () => {
      const isStillOnline = removeOnline(userId, socket.id);
      if (!isStillOnline) {
        socket.broadcast.emit("presence:update", { userId, isOnline: false, lastSeenAt: new Date().toISOString() });
      }
    });
  });

  return io;
}

function setOnline(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
}

function removeOnline(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return false;
  }

  return true;
}

function conversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}
