import type { JobApplicationStatus } from "@linkedin-clone/shared";
import type { JobApplicationRepository } from "#src/domain/repositories/job-application-repository.js";
import { JobApplicationModel, type JobApplicationDocument } from "#src/infrastructure/database/models/job-application-model.js";

export class MongoJobApplicationRepository implements JobApplicationRepository {
  create(input: Partial<JobApplicationDocument>) {
    return JobApplicationModel.create(input);
  }

  findById(id: string) {
    return JobApplicationModel.findById(id).exec();
  }

  findByJobAndApplicant(jobId: string, applicantUserId: string) {
    return JobApplicationModel.findOne({ jobId, applicantUserId }).exec();
  }

  listByJob(jobId: string) {
    return JobApplicationModel.find({ jobId }).sort({ appliedAt: -1 }).exec();
  }

  save(application: JobApplicationDocument) {
    return application.save();
  }

  countByStatus(status?: JobApplicationStatus) {
    return JobApplicationModel.countDocuments(status ? { status } : {}).exec();
  }
}
