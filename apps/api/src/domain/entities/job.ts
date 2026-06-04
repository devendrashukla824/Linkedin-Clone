import type { ExperienceLevel, JobType, WorkplaceType } from "@linkedin-clone/shared";

export interface JobEntity {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  workplaceType: WorkplaceType;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  postedById: string;
  applicants: string[];
  savedBy: string[];
  viewsCount: number;
  status?: "active" | "hidden" | "flagged";
  createdAt: Date;
  updatedAt: Date;
}
