export interface RepostEntity {
  id: string;
  postId: string;
  userId: string;
  caption?: string;
  createdAt: Date;
  updatedAt: Date;
}
