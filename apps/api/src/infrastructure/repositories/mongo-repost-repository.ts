import type { RepostRepository } from "#src/domain/repositories/repost-repository.js";
import { RepostModel, type RepostDocument } from "#src/infrastructure/database/models/repost-model.js";

export class MongoRepostRepository implements RepostRepository {
  create(input: Partial<RepostDocument>) {
    return RepostModel.create(input);
  }

  findById(id: string) {
    return RepostModel.findById(id).populate("user").populate({ path: "post", populate: { path: "author" } }).exec();
  }

  findRecentByPostAndUser(postId: string, userId: string, since: Date) {
    return RepostModel.findOne({ postId, userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).exec();
  }

  listFeed(limit: number, cursor?: string) {
    const query = cursor ? { _id: { $lt: cursor } } : {};
    return RepostModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user")
      .populate({ path: "post", populate: { path: "author" } })
      .exec();
  }

  countByPost(postId: string) {
    return RepostModel.countDocuments({ postId }).exec();
  }

  listByPost(postId: string, limit: number) {
    return RepostModel.find({ postId }).sort({ createdAt: -1 }).limit(limit).populate("user").exec();
  }

  async countByPosts(postIds: string[]) {
    if (!postIds.length) {
      return new Map<string, number>();
    }
    const counts = await RepostModel.aggregate<{ _id: string; count: number }>([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } }
    ]).exec();
    return new Map(counts.map((item) => [item._id, item.count]));
  }

  async findPostIdsRepostedByUser(postIds: string[], userId: string) {
    if (!postIds.length) {
      return new Set<string>();
    }
    const reposts = await RepostModel.find({ postId: { $in: postIds }, userId }).select("postId").exec();
    return new Set(reposts.map((repost) => repost.postId));
  }

  async deleteById(id: string) {
    await RepostModel.findByIdAndDelete(id).exec();
  }
}
