import { Router } from "express";
import {
  conversationMessagesController,
  messagingOverviewController
} from "#src/interfaces/http/controllers/message-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";

export const messageRoutes = Router();

messageRoutes.use(authMiddleware);
messageRoutes.get("/", messagingOverviewController);
messageRoutes.get("/:conversationId/messages", conversationMessagesController);
