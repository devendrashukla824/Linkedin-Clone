import type { JobFilters } from "@linkedin-clone/shared";
import type { JobDocument } from "#src/infrastructure/database/models/job-model.js";

export interface JobRepository {
  create(input: Partial<JobDocument>): Promise<JobDocument>;
  list(filters: JobFilters): Promise<{ jobs: JobDocument[]; total: number }>;
  findById(id: string): Promise<JobDocument | null>;
  save(job: JobDocument): Promise<JobDocument>;
  deleteById(id: string): Promise<void>;
}
