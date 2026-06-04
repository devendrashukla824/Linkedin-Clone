import type { RepostDocument } from "#src/infrastructure/database/models/repost-model.js";

export interface RepostRepository {
  create(input: Partial<RepostDocument>): Promise<RepostDocument>;
  findById(id: string): Promise<RepostDocument | null>;
  findRecentByPostAndUser(postId: string, userId: string, since: Date): Promise<RepostDocument | null>;
  listFeed(limit: number, cursor?: string): Promise<RepostDocument[]>;
  countByPost(postId: string): Promise<number>;
  listByPost(postId: string, limit: number): Promise<RepostDocument[]>;
  countByPosts(postIds: string[]): Promise<Map<string, number>>;
  findPostIdsRepostedByUser(postIds: string[], userId: string): Promise<Set<string>>;
  deleteById(id: string): Promise<void>;
}
