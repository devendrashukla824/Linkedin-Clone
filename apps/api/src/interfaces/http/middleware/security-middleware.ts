import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "#src/shared/errors/app-error.js";

interface RateRecord {
  count: number;
  resetAt: number;
}

const rateWindowMs = 15 * 60 * 1000;
const maxRequests = 300;
const authMaxRequests = 40;
const rateStore = new Map<string, RateRecord>();

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction) {
  const requestId =
    typeof request.headers["x-request-id"] === "string" && request.headers["x-request-id"].length < 80
      ? request.headers["x-request-id"]
      : randomUUID();

  response.setHeader("x-request-id", requestId);
  next();
}

export function cacheControlMiddleware(request: Request, response: Response, next: NextFunction) {
  if (request.path === "/health") {
    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  } else {
    response.setHeader("Cache-Control", "no-store");
  }
  next();
}

export function jsonContentTypeMiddleware(request: Request, _response: Response, next: NextFunction) {
  const hasBody = Number(request.headers["content-length"] ?? 0) > 0 || Boolean(request.headers["transfer-encoding"]);
  if (
    hasBody &&
    ["POST", "PUT", "PATCH"].includes(request.method) &&
    !request.is("multipart/form-data") &&
    !request.is("application/json")
  ) {
    next(new AppError(415, "Content-Type must be application/json"));
    return;
  }
  next();
}

export function rateLimitMiddleware(request: Request, response: Response, next: NextFunction) {
  const now = Date.now();
  cleanupExpiredRateRecords(now);
  const key = `${request.ip}:${request.path.startsWith("/api/v1/auth") ? "auth" : "api"}`;
  const limit = request.path.startsWith("/api/v1/auth") ? authMaxRequests : maxRequests;
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + rateWindowMs });
    setRateHeaders(response, limit, limit - 1, now + rateWindowMs);
    next();
    return;
  }

  current.count += 1;
  const remaining = Math.max(0, limit - current.count);
  setRateHeaders(response, limit, remaining, current.resetAt);

  if (current.count > limit) {
    next(new AppError(429, "Too many requests. Please try again later."));
    return;
  }

  next();
}

function cleanupExpiredRateRecords(now: number) {
  if (rateStore.size < 1000) {
    return;
  }

  for (const [key, record] of rateStore.entries()) {
    if (record.resetAt <= now) {
      rateStore.delete(key);
    }
  }
}

function setRateHeaders(response: Response, limit: number, remaining: number, resetAt: number) {
  response.setHeader("RateLimit-Limit", String(limit));
  response.setHeader("RateLimit-Remaining", String(remaining));
  response.setHeader("RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
}
