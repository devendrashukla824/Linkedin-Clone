import type { NextFunction, Request, Response } from "express";
import { MessageUseCases } from "#src/application/messages/message-use-cases.js";
import { MongoMessageRepository } from "#src/infrastructure/repositories/mongo-message-repository.js";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { AppError } from "#src/shared/errors/app-error.js";

const messageUseCases = new MessageUseCases(new MongoMessageRepository(), new MongoUserRepository());

export async function messagingOverviewController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await messageUseCases.overview(request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function conversationMessagesController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await messageUseCases.listMessages(request.params.conversationId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
