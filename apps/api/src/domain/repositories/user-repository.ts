import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";

export interface UserRepository {
  create(input: Partial<UserDocument>): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findById(id: string): Promise<UserDocument | null>;
  listSuggestions(userId: string, limit: number): Promise<UserDocument[]>;
  listByIds(ids: string[]): Promise<UserDocument[]>;
  save(user: UserDocument): Promise<UserDocument>;
}
