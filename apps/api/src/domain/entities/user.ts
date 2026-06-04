import type { ContactDetails, EducationItem, ExperienceItem, UserRole } from "@linkedin-clone/shared";

export interface UserEntity {
  id: string;
  role: UserRole;
  status: "active" | "suspended";
  name: string;
  email: string;
  passwordHash: string;
  headline: string;
  avatarUrl?: string;
  coverUrl?: string;
  about?: string;
  location?: string;
  company?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  contact: ContactDetails;
  connections: string[];
  followers: string[];
  following: string[];
  sentConnectionRequests: string[];
  receivedConnectionRequests: string[];
  createdAt: Date;
  updatedAt: Date;
}
