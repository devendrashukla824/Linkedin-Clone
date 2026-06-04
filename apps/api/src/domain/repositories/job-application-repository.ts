import type { JobApplicationStatus } from "@linkedin-clone/shared";
import type { JobApplicationDocument } from "#src/infrastructure/database/models/job-application-model.js";

export interface JobApplicationRepository {
  create(input: Partial<JobApplicationDocument>): Promise<JobApplicationDocument>;
  findById(id: string): Promise<JobApplicationDocument | null>;
  findByJobAndApplicant(jobId: string, applicantUserId: string): Promise<JobApplicationDocument | null>;
  listByJob(jobId: string): Promise<JobApplicationDocument[]>;
  save(application: JobApplicationDocument): Promise<JobApplicationDocument>;
  countByStatus(status?: JobApplicationStatus): Promise<number>;
}
