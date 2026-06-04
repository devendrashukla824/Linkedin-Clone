import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AdminUseCases } from "#src/application/admin/admin-use-cases.js";
import { AppError } from "#src/shared/errors/app-error.js";

const adminUseCases = new AdminUseCases();

const userUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional()
});

const moderationSchema = z.object({
  status: z.enum(["active", "hidden", "flagged"])
});

const reportSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved"])
});

export async function adminOverviewController(_request: Request, response: Response, next: NextFunction) {
  try {
    const data = await adminUseCases.overview();
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateUserController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireAdmin(request);
    const payload = userUpdateSchema.parse(request.body);
    const data = await adminUseCases.updateUser(request.params.userId, payload, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function adminModerateJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireAdmin(request);
    const payload = moderationSchema.parse(request.body);
    const data = await adminUseCases.moderateJob(request.params.jobId, payload.status, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function adminModeratePostController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireAdmin(request);
    const payload = moderationSchema.parse(request.body);
    const data = await adminUseCases.moderatePost(request.params.postId, payload.status, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateReportController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireAdmin(request);
    const payload = reportSchema.parse(request.body);
    const data = await adminUseCases.updateReport(request.params.reportId, payload.status, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

function requireAdmin(request: Request) {
  if (!request.user || request.user.role !== "admin") {
    throw new AppError(403, "Admin access required");
  }
  return request.user;
}
