import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "#src/config/env.js";
import { errorMiddleware } from "#src/interfaces/http/middleware/error-middleware.js";
import {
  cacheControlMiddleware,
  jsonContentTypeMiddleware,
  rateLimitMiddleware,
  requestIdMiddleware
} from "#src/interfaces/http/middleware/security-middleware.js";
import { adminRoutes } from "#src/interfaces/http/routes/admin-routes.js";
import { authRoutes } from "#src/interfaces/http/routes/auth-routes.js";
import { jobRoutes } from "#src/interfaces/http/routes/job-routes.js";
import { messageRoutes } from "#src/interfaces/http/routes/message-routes.js";
import { networkRoutes } from "#src/interfaces/http/routes/network-routes.js";
import { notificationRoutes } from "#src/interfaces/http/routes/notification-routes.js";
import { postRoutes } from "#src/interfaces/http/routes/post-routes.js";
import { profileRoutes } from "#src/interfaces/http/routes/profile-routes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    })
  );
  app.use(rateLimitMiddleware);
  app.use(cacheControlMiddleware);
  app.use(jsonContentTypeMiddleware);
  app.use("/uploads", express.static("uploads"));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_request, response) => {
    response.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/jobs", jobRoutes);
  app.use("/api/v1/messages", messageRoutes);
  app.use("/api/v1/network", networkRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/posts", postRoutes);
  app.use("/api/v1/profiles", profileRoutes);
  app.use(errorMiddleware);

  return app;
}
