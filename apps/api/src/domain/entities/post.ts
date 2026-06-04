import type { FeedComment } from "@linkedin-clone/shared";

export interface PostEntity {
  id: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  likes: string[];
  comments: FeedComment[];
  shares: string[];
  status?: "active" | "hidden" | "flagged";
  reportsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
