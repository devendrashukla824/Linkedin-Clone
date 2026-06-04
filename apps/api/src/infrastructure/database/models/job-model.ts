import { Schema, model, type HydratedDocument } from "mongoose";
import type { JobEntity } from "#src/domain/entities/job.js";

export type JobDocument = HydratedDocument<JobEntity>;

const jobSchema = new Schema<JobEntity>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120, index: true },
    companyLogoUrl: String,
    location: { type: String, required: true, trim: true, maxlength: 140, index: true },
    workplaceType: { type: String, enum: ["Remote", "Hybrid", "On-site"], required: true, index: true },
    jobType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"], required: true, index: true },
    experienceLevel: {
      type: String,
      enum: ["Internship", "Entry level", "Associate", "Mid-Senior level", "Director"],
      required: true,
      index: true
    },
    salaryRange: { type: String, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    skills: { type: [String], default: [], index: true },
    postedById: { type: String, ref: "User", required: true, index: true },
    applicants: { type: [String], default: [] },
    savedBy: { type: [String], default: [] },
    viewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "hidden", "flagged"], default: "active", index: true }
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", company: "text", location: "text", description: "text", skills: "text" });

jobSchema.virtual("postedBy", {
  ref: "User",
  localField: "postedById",
  foreignField: "_id",
  justOne: true
});

jobSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const JobModel = model<JobEntity>("Job", jobSchema);
