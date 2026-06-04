import { Schema, model, type HydratedDocument } from "mongoose";
import type { JobApplicationEntity } from "#src/domain/entities/job-application.js";

export type JobApplicationDocument = HydratedDocument<JobApplicationEntity>;

const jobApplicationSchema = new Schema<JobApplicationEntity>(
  {
    applicantName: { type: String, required: true, trim: true, maxlength: 120 },
    phoneNumber: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 160 },
    linkedinUrl: { type: String, trim: true, maxlength: 300 },
    portfolioUrl: { type: String, trim: true, maxlength: 300 },
    experience: { type: String, trim: true, maxlength: 80 },
    coverLetter: { type: String, trim: true, maxlength: 5000 },
    resumeUrl: { type: String, required: true },
    resumeFileName: { type: String, trim: true, maxlength: 220 },
    jobId: { type: String, ref: "Job", required: true, index: true },
    applicantUserId: { type: String, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["Applied", "Reviewing", "Shortlisted", "Rejected", "Hired"],
      default: "Applied",
      index: true
    },
    appliedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

jobApplicationSchema.index({ jobId: 1, applicantUserId: 1 }, { unique: true });

jobApplicationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    record.id = record._id?.toString();
    delete record._id;
    delete record.__v;
  }
});

export const JobApplicationModel = model<JobApplicationEntity>("JobApplication", jobApplicationSchema);
