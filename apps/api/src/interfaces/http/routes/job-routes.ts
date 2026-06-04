import { Router } from "express";
import {
  applyJobController,
  createJobController,
  deleteJobController,
  getJobController,
  listJobApplicationsController,
  listJobsController,
  submitJobApplicationController,
  toggleSaveJobController,
  updateApplicationStatusController,
  updateJobController
} from "#src/interfaces/http/controllers/job-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";
import { resumeUpload } from "#src/interfaces/http/middleware/upload-middleware.js";

export const jobRoutes = Router();

jobRoutes.use(authMiddleware);
jobRoutes.get("/", listJobsController);
jobRoutes.post("/", createJobController);
jobRoutes.patch("/applications/:applicationId/status", updateApplicationStatusController);
jobRoutes.get("/:jobId", getJobController);
jobRoutes.patch("/:jobId", updateJobController);
jobRoutes.delete("/:jobId", deleteJobController);
jobRoutes.post("/:jobId/apply", applyJobController);
jobRoutes.post("/:jobId/applications", resumeUpload.single("resume"), submitJobApplicationController);
jobRoutes.get("/:jobId/applications", listJobApplicationsController);
jobRoutes.post("/:jobId/save", toggleSaveJobController);
