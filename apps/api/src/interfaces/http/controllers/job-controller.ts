import type { NextFunction, Request, Response } from "express";
import type { JobApplicationStatus, JobFilters } from "@linkedin-clone/shared";
import { z } from "zod";
import { JobUseCases } from "#src/application/jobs/job-use-cases.js";
import { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import { MongoJobApplicationRepository } from "#src/infrastructure/repositories/mongo-job-application-repository.js";
import { MongoNotificationRepository } from "#src/infrastructure/repositories/mongo-notification-repository.js";
import { MongoJobRepository } from "#src/infrastructure/repositories/mongo-job-repository.js";
import { CloudinaryUploadService } from "#src/infrastructure/services/cloudinary-upload-service.js";
import { AppError } from "#src/shared/errors/app-error.js";

const jobUseCases = new JobUseCases(
  new MongoJobRepository(),
  new MongoJobApplicationRepository(),
  new NotificationUseCases(new MongoNotificationRepository())
);
const uploads = new CloudinaryUploadService();

const arrayFromText = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string().min(1)).default([]));

const jobSchema = z.object({
  title: z.string().min(2).max(140),
  company: z.string().min(2).max(120),
  companyLogoUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().min(2).max(140),
  workplaceType: z.enum(["Remote", "Hybrid", "On-site"]),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
  experienceLevel: z.enum(["Internship", "Entry level", "Associate", "Mid-Senior level", "Director"]),
  salaryRange: z.string().max(120).optional().or(z.literal("")),
  description: z.string().min(20).max(5000),
  responsibilities: arrayFromText,
  requirements: arrayFromText,
  skills: arrayFromText
});

const filtersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  workplaceType: z.enum(["All", "Remote", "Hybrid", "On-site"]).optional(),
  jobType: z.enum(["All", "Full-time", "Part-time", "Contract", "Internship"]).optional(),
  experienceLevel: z.enum(["All", "Internship", "Entry level", "Associate", "Mid-Senior level", "Director"]).optional(),
  sort: z.enum(["recent", "relevant", "applicants"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
});

const optionalUrl = z.string().url().optional().or(z.literal(""));

const applicationSchema = z.object({
  applicantName: z.string().min(2).max(120),
  phoneNumber: z.string().min(7).max(30),
  email: z.string().email().max(160),
  location: z.string().max(160).optional().or(z.literal("")),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  experience: z.string().max(80).optional().or(z.literal("")),
  coverLetter: z.string().max(5000).optional().or(z.literal(""))
});

const applicationStatusSchema = z.object({
  status: z.enum(["Applied", "Reviewing", "Shortlisted", "Rejected", "Hired"])
});

export async function listJobsController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const filters = filtersSchema.parse(request.query) as JobFilters;
    const data = await jobUseCases.list(filters, user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const data = await jobUseCases.getById(request.params.jobId, user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const payload = normalizeJobPayload(jobSchema.parse(request.body));
    const data = await jobUseCases.create(payload, user);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const payload = normalizeJobPayload(jobSchema.partial().parse(request.body));
    const data = await jobUseCases.update(request.params.jobId, payload, user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const data = await jobUseCases.delete(request.params.jobId, user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function applyJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const data = await jobUseCases.apply(request.params.jobId, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function submitJobApplicationController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const payload = normalizeApplicationPayload(applicationSchema.parse(request.body));
    if (!request.file) {
      throw new AppError(400, "Resume upload is required");
    }
    const allowedResumeTypes = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]);
    if (!allowedResumeTypes.has(request.file.mimetype)) {
      throw new AppError(400, "Resume must be a PDF or DOCX file");
    }

    const uploadResult = await uploads.uploadFile(request.file.buffer, "linkedin-clone/resumes", request.file.originalname);
    const resumeUrl = uploadResult.secure_url.startsWith("/")
      ? `${request.protocol}://${request.get("host")}${uploadResult.secure_url}`
      : uploadResult.secure_url;

    const data = await jobUseCases.submitApplication(request.params.jobId, user, {
      ...payload,
      resumeUrl,
      resumeFileName: request.file.originalname
    });
    response.status(201).json({ success: true, message: "Application submitted successfully", data });
  } catch (error) {
    next(error);
  }
}

export async function listJobApplicationsController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const data = await jobUseCases.listApplications(request.params.jobId, user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatusController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const payload = applicationStatusSchema.parse(request.body);
    const data = await jobUseCases.updateApplicationStatus(
      request.params.applicationId,
      payload.status as JobApplicationStatus,
      user
    );
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function toggleSaveJobController(request: Request, response: Response, next: NextFunction) {
  try {
    const user = requireUser(request);
    const data = await jobUseCases.toggleSave(request.params.jobId, user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

function requireUser(request: Request) {
  if (!request.user) {
    throw new AppError(401, "Authentication required");
  }
  return request.user;
}

function normalizeJobPayload<T extends Record<string, unknown>>(payload: T) {
  return {
    ...payload,
    companyLogoUrl: payload.companyLogoUrl || undefined,
    salaryRange: payload.salaryRange || undefined
  };
}

function normalizeApplicationPayload<T extends Record<string, string | undefined>>(payload: T) {
  return {
    applicantName: payload.applicantName?.trim() ?? "",
    phoneNumber: payload.phoneNumber?.trim() ?? "",
    email: payload.email?.trim() ?? "",
    location: payload.location?.trim() || undefined,
    linkedinUrl: payload.linkedinUrl?.trim() || undefined,
    portfolioUrl: payload.portfolioUrl?.trim() || undefined,
    experience: payload.experience?.trim() || undefined,
    coverLetter: payload.coverLetter?.trim() || undefined
  };
}
