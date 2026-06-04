import type { PostRepository } from "#src/domain/repositories/post-repository.js";
import { PostModel, type PostDocument } from "#src/infrastructure/database/models/post-model.js";

export class MongoPostRepository implements PostRepository {
  create(input: Partial<PostDocument>) {
    return PostModel.create(input);
  }

  listFeed(limit: number, cursor?: string) {
    const query = cursor ? { _id: { $lt: cursor } } : {};
    return PostModel.find(query).sort({ createdAt: -1 }).limit(limit).populate("author").exec();
  }

  listByIds(ids: string[]) {
    return PostModel.find({ _id: { $in: ids } }).populate("author").exec();
  }

  findById(id: string) {
    return PostModel.findById(id).populate("author").exec();
  }

  save(post: PostDocument) {
    return post.save();
  }

  async deleteById(id: string) {
    await PostModel.findByIdAndDelete(id).exec();
  }
}
