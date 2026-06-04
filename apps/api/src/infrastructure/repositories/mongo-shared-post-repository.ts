import type { SharedPostRepository } from "#src/domain/repositories/shared-post-repository.js";
import { SharedPostModel, type SharedPostDocument } from "#src/infrastructure/database/models/shared-post-model.js";

export class MongoSharedPostRepository implements SharedPostRepository {
  create(input: Partial<SharedPostDocument>) {
    return SharedPostModel.create(input);
  }

  findById(id: string) {
    return SharedPostModel.findById(id).exec();
  }

  listForUser(userId: string, limit: number) {
    return SharedPostModel.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).sort({ sentAt: -1 }).limit(limit).exec();
  }

  save(sharedPost: SharedPostDocument) {
    return sharedPost.save();
  }

  async deleteById(id: string) {
    await SharedPostModel.findByIdAndDelete(id).exec();
  }
}
