import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { JwtService } from "#src/infrastructure/services/jwt-service.js";
import { AppError } from "#src/shared/errors/app-error.js";

const users = new MongoUserRepository();
const jwtService = new JwtService();

export async function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = jwtService.verify(token);
    const user = await users.findById(payload.userId);

    if (!user) {
      throw new AppError(401, "Authentication required");
    }

    if (user.status === "suspended") {
      throw new AppError(403, "This account has been suspended");
    }

    request.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "Session expired. Please sign in again."));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, "Invalid authentication token"));
      return;
    }

    next(error);
  }
}
