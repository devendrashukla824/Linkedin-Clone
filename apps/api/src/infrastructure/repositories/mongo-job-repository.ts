import type { FilterQuery, SortOrder } from "mongoose";
import type { JobFilters } from "@linkedin-clone/shared";
import type { JobEntity } from "#src/domain/entities/job.js";
import type { JobRepository } from "#src/domain/repositories/job-repository.js";
import { JobModel, type JobDocument } from "#src/infrastructure/database/models/job-model.js";

export class MongoJobRepository implements JobRepository {
  create(input: Partial<JobDocument>) {
    return JobModel.create(input);
  }

  async list(filters: JobFilters) {
    const page = Math.max(1, Number(filters.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(filters.limit ?? 10)));
    const query = this.buildQuery(filters);
    const sort = this.buildSort(filters.sort);

    const [jobs, total] = await Promise.all([
      JobModel.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("postedBy")
        .exec(),
      JobModel.countDocuments(query).exec()
    ]);

    return { jobs, total };
  }

  findById(id: string) {
    return JobModel.findById(id).populate("postedBy").exec();
  }

  save(job: JobDocument) {
    return job.save();
  }

  async deleteById(id: string) {
    await JobModel.findByIdAndDelete(id).exec();
  }

  private buildQuery(filters: JobFilters): FilterQuery<JobEntity> {
    const query: FilterQuery<JobEntity> = {};
    if (filters.query?.trim()) {
      query.$text = { $search: filters.query.trim() };
    }
    if (filters.location?.trim()) {
      query.location = { $regex: filters.location.trim(), $options: "i" };
    }
    if (filters.workplaceType && filters.workplaceType !== "All") {
      query.workplaceType = filters.workplaceType;
    }
    if (filters.jobType && filters.jobType !== "All") {
      query.jobType = filters.jobType;
    }
    if (filters.experienceLevel && filters.experienceLevel !== "All") {
      query.experienceLevel = filters.experienceLevel;
    }
    return query;
  }

  private buildSort(sort: JobFilters["sort"]): Record<string, SortOrder> {
    if (sort === "applicants") {
      return { applicants: -1, createdAt: -1 };
    }
    if (sort === "relevant") {
      return { viewsCount: -1, createdAt: -1 };
    }
    return { createdAt: -1 };
  }
}
