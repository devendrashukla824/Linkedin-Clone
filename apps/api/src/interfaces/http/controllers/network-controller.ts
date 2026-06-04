import type { NextFunction, Request, Response } from "express";
import { NetworkUseCases } from "#src/application/network/network-use-cases.js";
import { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import { MongoNotificationRepository } from "#src/infrastructure/repositories/mongo-notification-repository.js";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { AppError } from "#src/shared/errors/app-error.js";

const networkUseCases = new NetworkUseCases(
  new MongoUserRepository(),
  new NotificationUseCases(new MongoNotificationRepository())
);

export async function networkOverviewController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await networkUseCases.overview(request.user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function sendConnectionRequestController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await networkUseCases.sendRequest(request.user, request.params.userId);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function acceptConnectionRequestController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await networkUseCases.acceptRequest(request.user, request.params.userId);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function rejectConnectionRequestController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await networkUseCases.rejectRequest(request.user, request.params.userId);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function removeConnectionController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await networkUseCases.removeConnection(request.user, request.params.userId);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
