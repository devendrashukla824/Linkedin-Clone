import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import { MongoNotificationRepository } from "#src/infrastructure/repositories/mongo-notification-repository.js";
import { AppError } from "#src/shared/errors/app-error.js";

const notificationUseCases = new NotificationUseCases(new MongoNotificationRepository());

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1)
});

export async function notificationsOverviewController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await notificationUseCases.overview(request.user.id, Number(request.query.limit ?? 30));
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationsReadController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const payload = markReadSchema.parse(request.body);
    const data = await notificationUseCases.markRead(request.user.id, payload.notificationIds);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsReadController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await notificationUseCases.markAllRead(request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
