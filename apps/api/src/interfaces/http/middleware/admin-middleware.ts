import type { NextFunction, Request, Response } from "express";
import { AppError } from "#src/shared/errors/app-error.js";

export function adminMiddleware(request: Request, _response: Response, next: NextFunction) {
  if (!request.user) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  if (request.user.role !== "admin") {
    next(new AppError(403, "Admin access required"));
    return;
  }

  next();
}
