import type { UserRepository } from "#src/domain/repositories/user-repository.js";
import { UserModel, type UserDocument } from "#src/infrastructure/database/models/user-model.js";

export class MongoUserRepository implements UserRepository {
  create(input: Partial<UserDocument>) {
    return UserModel.create(input);
  }

  findByEmail(email: string) {
    return UserModel.findOne({ email }).exec();
  }

  findById(id: string) {
    return UserModel.findById(id).exec();
  }

  listSuggestions(userId: string, limit: number) {
    return UserModel.find({ _id: { $ne: userId }, connections: { $ne: userId } }).limit(limit).exec();
  }

  listByIds(ids: string[]) {
    return UserModel.find({ _id: { $in: ids } }).exec();
  }

  save(user: UserDocument) {
    return user.save();
  }
}
