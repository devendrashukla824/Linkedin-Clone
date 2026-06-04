import type { PostDocument } from "#src/infrastructure/database/models/post-model.js";

export interface PostRepository {
  create(input: Partial<PostDocument>): Promise<PostDocument>;
  listFeed(limit: number, cursor?: string): Promise<PostDocument[]>;
  listByIds(ids: string[]): Promise<PostDocument[]>;
  findById(id: string): Promise<PostDocument | null>;
  save(post: PostDocument): Promise<PostDocument>;
  deleteById(id: string): Promise<void>;
}
