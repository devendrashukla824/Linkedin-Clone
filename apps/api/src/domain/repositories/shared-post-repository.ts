import type { SharedPostDocument } from "#src/infrastructure/database/models/shared-post-model.js";

export interface SharedPostRepository {
  create(input: Partial<SharedPostDocument>): Promise<SharedPostDocument>;
  findById(id: string): Promise<SharedPostDocument | null>;
  listForUser(userId: string, limit: number): Promise<SharedPostDocument[]>;
  save(sharedPost: SharedPostDocument): Promise<SharedPostDocument>;
  deleteById(id: string): Promise<void>;
}
