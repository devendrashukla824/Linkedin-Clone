import { Router } from "express";
import {
  acceptConnectionRequestController,
  networkOverviewController,
  rejectConnectionRequestController,
  removeConnectionController,
  sendConnectionRequestController
} from "#src/interfaces/http/controllers/network-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";

export const networkRoutes = Router();

networkRoutes.use(authMiddleware);
networkRoutes.get("/", networkOverviewController);
networkRoutes.post("/requests/:userId", sendConnectionRequestController);
networkRoutes.post("/requests/:userId/accept", acceptConnectionRequestController);
networkRoutes.post("/requests/:userId/reject", rejectConnectionRequestController);
networkRoutes.delete("/connections/:userId", removeConnectionController);
