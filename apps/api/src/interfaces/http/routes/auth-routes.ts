import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController
} from "#src/interfaces/http/controllers/auth-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.get("/me", authMiddleware, meController);
authRoutes.post("/logout", authMiddleware, logoutController);
