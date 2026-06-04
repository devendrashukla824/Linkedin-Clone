import { Router } from "express";
import {
  markAllNotificationsReadController,
  markNotificationsReadController,
  notificationsOverviewController
} from "#src/interfaces/http/controllers/notification-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";

export const notificationRoutes = Router();

notificationRoutes.use(authMiddleware);
notificationRoutes.get("/", notificationsOverviewController);
notificationRoutes.patch("/read", markNotificationsReadController);
notificationRoutes.patch("/read-all", markAllNotificationsReadController);
