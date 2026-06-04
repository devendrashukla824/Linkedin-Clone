import { Router } from "express";
import {
  adminModerateJobController,
  adminModeratePostController,
  adminOverviewController,
  adminUpdateReportController,
  adminUpdateUserController
} from "#src/interfaces/http/controllers/admin-controller.js";
import { adminMiddleware } from "#src/interfaces/http/middleware/admin-middleware.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";

export const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminMiddleware);
adminRoutes.get("/overview", adminOverviewController);
adminRoutes.patch("/users/:userId", adminUpdateUserController);
adminRoutes.patch("/jobs/:jobId/moderation", adminModerateJobController);
adminRoutes.patch("/posts/:postId/moderation", adminModeratePostController);
adminRoutes.patch("/reports/:reportId", adminUpdateReportController);
