import type {
  CreateJobApplicationInput,
  CreateJobInput,
  JobApplication,
  JobApplicationStatus,
  JobFilters,
  JobListing,
  PaginatedResponse,
  UpdateJobInput
} from "@linkedin-clone/shared";
import type { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import type { JobApplicationRepository } from "#src/domain/repositories/job-application-repository.js";
import type { JobRepository } from "#src/domain/repositories/job-repository.js";
import type { JobApplicationDocument } from "#src/infrastructure/database/models/job-application-model.js";
import type { JobDocument } from "#src/infrastructure/database/models/job-model.js";
import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";
import { AppError } from "#src/shared/errors/app-error.js";

export class JobUseCases {
  constructor(
    private readonly jobs: JobRepository,
    private readonly applications: JobApplicationRepository,
    private readonly notifications?: NotificationUseCases
  ) {}

  async create(input: CreateJobInput, user: UserDocument): Promise<JobListing> {
    const job = await this.jobs.create({
      ...input,
      postedById: user.id,
      applicants: [],
      savedBy: [],
      viewsCount: 0
    });

    job.set("postedBy", user, { strict: false });
    return this.toListing(job, user.id);
  }

  async list(filters: JobFilters, currentUserId: string): Promise<PaginatedResponse<JobListing>> {
    const page = Math.max(1, Number(filters.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(filters.limit ?? 10)));
    const { jobs, total } = await this.jobs.list({ ...filters, page, limit });

    return {
      items: jobs.map((job) => this.toListing(job, currentUserId)),
      page,
      limit,
      total,
      hasMore: page * limit < total
    };
  }

  async getById(id: string, currentUserId: string): Promise<JobListing> {
    const job = await this.getJob(id);
    job.viewsCount = (job.viewsCount ?? 0) + 1;
    await this.jobs.save(job);
    return this.toListing(job, currentUserId);
  }

  async update(id: string, input: UpdateJobInput, currentUserId: string): Promise<JobListing> {
    const job = await this.getOwnedJob(id, currentUserId);
    Object.assign(job, input);
    await this.jobs.save(job);
    return this.toListing(job, currentUserId);
  }

  async delete(id: string, currentUserId: string) {
    await this.getOwnedJob(id, currentUserId);
    await this.jobs.deleteById(id);
    return { deleted: true };
  }

  async apply(id: string, currentUser: UserDocument) {
    throw new AppError(400, "Use the full application form with a resume upload");
  }

  async submitApplication(
    id: string,
    currentUser: UserDocument,
    input: CreateJobApplicationInput & { resumeUrl: string; resumeFileName?: string }
  ): Promise<JobApplication> {
    const job = await this.getJob(id);
    const existingApplication = await this.applications.findByJobAndApplicant(id, currentUser.id);
    if (existingApplication) {
      throw new AppError(409, "You have already applied to this job");
    }

    const application = await this.applications.create({
      ...input,
      jobId: id,
      applicantUserId: currentUser.id,
      status: "Applied",
      appliedAt: new Date()
    });

    if (!job.applicants.includes(currentUser.id)) {
      job.applicants = [...job.applicants, currentUser.id];
      await this.jobs.save(job);
    }

    await this.notifications?.create({
      recipientId: job.postedById,
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        headline: currentUser.headline,
        avatarUrl: currentUser.avatarUrl
      },
      type: "job_application",
      title: `${currentUser.name} applied to ${job.title}`,
      body: `${input.applicantName} submitted an application for ${job.company}.`,
      entityId: job.id,
      entityType: "job",
      href: `/jobs/${job.id}`
    });

    return this.toApplication(application, job);
  }

  async listApplications(jobId: string, currentUser: UserDocument): Promise<JobApplication[]> {
    const job = await this.getManageableJob(jobId, currentUser);
    const applications = await this.applications.listByJob(jobId);
    return applications.map((application) => this.toApplication(application, job));
  }

  async updateApplicationStatus(applicationId: string, status: JobApplicationStatus, currentUser: UserDocument) {
    const application = await this.applications.findById(applicationId);
    if (!application) {
      throw new AppError(404, "Application not found");
    }

    const job = await this.getManageableJob(application.jobId, currentUser);
    application.status = status;
    await this.applications.save(application);
    return this.toApplication(application, job);
  }

  async toggleSave(id: string, currentUserId: string) {
    const job = await this.getJob(id);
    const isSaved = job.savedBy.includes(currentUserId);
    job.savedBy = isSaved ? job.savedBy.filter((userId) => userId !== currentUserId) : [...job.savedBy, currentUserId];
    await this.jobs.save(job);
    return this.toListing(job, currentUserId);
  }

  private async getJob(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) {
      throw new AppError(404, "Job not found");
    }
    return job;
  }

  private async getOwnedJob(id: string, currentUserId: string) {
    const job = await this.getJob(id);
    if (job.postedById !== currentUserId) {
      throw new AppError(403, "You can only manage jobs you posted");
    }
    return job;
  }

  private async getManageableJob(id: string, currentUser: UserDocument) {
    const job = await this.getJob(id);
    if (job.postedById !== currentUser.id && currentUser.role !== "admin") {
      throw new AppError(403, "You can only view applications for jobs you posted");
    }
    return job;
  }

  private toListing(job: JobDocument, currentUserId: string): JobListing {
    const postedBy = job.get("postedBy") as UserDocument | undefined;

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogoUrl: job.companyLogoUrl,
      location: job.location,
      workplaceType: job.workplaceType,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      salaryRange: job.salaryRange,
      description: job.description,
      responsibilities: job.responsibilities ?? [],
      requirements: job.requirements ?? [],
      skills: job.skills ?? [],
      postedBy: postedBy
        ? {
            id: postedBy.id,
            name: postedBy.name,
            headline: postedBy.headline,
            avatarUrl: postedBy.avatarUrl
          }
        : {
            id: job.postedById,
            name: "Hiring team",
            headline: "Talent acquisition"
          },
      applicantsCount: job.applicants.length,
      viewsCount: job.viewsCount ?? 0,
      hasApplied: job.applicants.includes(currentUserId),
      isSaved: job.savedBy.includes(currentUserId),
      canManage: job.postedById === currentUserId,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString()
    };
  }

  private toApplication(application: JobApplicationDocument, job: JobDocument): JobApplication {
    return {
      id: application.id,
      applicantName: application.applicantName,
      phoneNumber: application.phoneNumber,
      email: application.email,
      location: application.location,
      linkedinUrl: application.linkedinUrl,
      portfolioUrl: application.portfolioUrl,
      experience: application.experience,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      resumeFileName: application.resumeFileName,
      jobId: application.jobId,
      jobTitle: job.title,
      applicantUserId: application.applicantUserId,
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
      updatedAt: application.updatedAt?.toISOString()
    };
  }
}
