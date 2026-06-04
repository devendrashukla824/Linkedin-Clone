import type { JobApplicationStatus } from "@linkedin-clone/shared";

export interface JobApplicationEntity {
  id: string;
  applicantName: string;
  phoneNumber: string;
  email: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experience?: string;
  coverLetter?: string;
  resumeUrl: string;
  resumeFileName?: string;
  jobId: string;
  applicantUserId: string;
  status: JobApplicationStatus;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
