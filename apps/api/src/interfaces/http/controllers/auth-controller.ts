import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthUseCases } from "#src/application/auth/auth-use-cases.js";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { AppError } from "#src/shared/errors/app-error.js";

const authUseCases = new AuthUseCases(new MongoUserRepository());

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  headline: z.string().max(160).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function registerController(request: Request, response: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(request.body);
    const data = await authUseCases.register(payload);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function loginController(request: Request, response: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(request.body);
    const data = await authUseCases.login(payload);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function meController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    response.json({ success: true, data: authUseCases.createProfile(request.user) });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(_request: Request, response: Response) {
  response.json({ success: true, message: "Logged out successfully", data: null });
}
