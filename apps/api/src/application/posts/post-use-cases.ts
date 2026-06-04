import { randomUUID } from "node:crypto";
import type {
  FeedAuthor,
  FeedComment,
  FeedPost,
  FeedPostPreview,
  PaginatedResponse,
  PostRecipient,
  RepostRecord,
  SharedPost
} from "@linkedin-clone/shared";
import type { MessageUseCases } from "#src/application/messages/message-use-cases.js";
import type { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import type { PostRepository } from "#src/domain/repositories/post-repository.js";
import type { RepostRepository } from "#src/domain/repositories/repost-repository.js";
import type { SharedPostRepository } from "#src/domain/repositories/shared-post-repository.js";
import type { UserRepository } from "#src/domain/repositories/user-repository.js";
import type { RepostDocument } from "#src/infrastructure/database/models/repost-model.js";
import type { SharedPostDocument } from "#src/infrastructure/database/models/shared-post-model.js";
import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";
import { emitMessage } from "#src/interfaces/realtime/notification-bus.js";
import { AppError } from "#src/shared/errors/app-error.js";

interface CreatePostInput {
  body: string;
  imageUrl?: string;
}

export class PostUseCases {
  private readonly repostCooldownMs = 10 * 60 * 1000;

  constructor(
    private readonly posts: PostRepository,
    private readonly reposts?: RepostRepository,
    private readonly sharedPosts?: SharedPostRepository,
    private readonly messages?: MessageUseCases,
    private readonly users?: UserRepository,
    private readonly notifications?: NotificationUseCases
  ) {}

  async create(input: CreatePostInput, user: UserDocument): Promise<FeedPost> {
    const post = await this.posts.create({
      ...input,
      authorId: user.id,
      comments: [],
      likes: [],
      shares: []
    });

    return {
      id: post.id,
      author: this.toAuthor(user),
      body: post.body,
      imageUrl: post.imageUrl,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      repostsCount: 0,
      hasLiked: false,
      hasReposted: false,
      canDelete: true,
      comments: [],
      createdAt: post.createdAt.toISOString()
    };
  }

  async listFeed(currentUserId: string, limit = 10, cursor?: string): Promise<PaginatedResponse<FeedPost>> {
    const [posts, reposts] = await Promise.all([
      this.posts.listFeed(limit + 1, cursor),
      this.reposts?.listFeed(limit + 1, cursor) ?? Promise.resolve([])
    ]);
    const postIds = [
      ...posts.map((post) => post.id),
      ...reposts.map((repost) => repost.postId)
    ];
    const [repostCounts, repostedByUser] = await Promise.all([
      this.reposts?.countByPosts(postIds) ?? Promise.resolve(new Map<string, number>()),
      this.reposts?.findPostIdsRepostedByUser(postIds, currentUserId) ?? Promise.resolve(new Set<string>())
    ]);
    const feedItems = [
      ...posts.map((post) => this.toFeedPost(post, currentUserId, repostCounts, repostedByUser)),
      ...reposts.map((repost) => this.toRepostFeedPost(repost, currentUserId, repostCounts, repostedByUser))
    ]
      .filter(Boolean)
      .sort((a, b) => this.feedScore(b as FeedPost) - this.feedScore(a as FeedPost)) as FeedPost[];
    const pageItems = feedItems.slice(0, limit);

    return {
      items: pageItems,
      page: 1,
      limit,
      total: pageItems.length,
      hasMore: posts.length > limit || reposts.length > limit
    };
  }

  async repost(postId: string, user: UserDocument, caption?: string): Promise<FeedPost> {
    if (!this.reposts) {
      throw new AppError(500, "Repost repository is not configured");
    }
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }
    const recent = await this.reposts.findRecentByPostAndUser(
      postId,
      user.id,
      new Date(Date.now() - this.repostCooldownMs)
    );
    if (recent) {
      throw new AppError(429, "You already reposted this recently. Please wait before reposting again.");
    }

    const repost = await this.reposts.create({ postId, userId: user.id, caption });
    repost.set("user", user, { strict: false });
    repost.set("post", post, { strict: false });

    await this.notifications?.create({
      recipientId: post.authorId,
      actor: this.toAuthor(user),
      type: "post_repost",
      title: `${user.name} reposted your post`,
      body: caption || post.body.slice(0, 120),
      entityId: post.id,
      entityType: "post",
      href: "/"
    });

    const counts = new Map([[post.id, await this.reposts.countByPost(post.id)]]);
    return this.toRepostFeedPost(repost, user.id, counts, new Set([post.id]));
  }

  async deleteRepost(repostId: string, userId: string) {
    if (!this.reposts) {
      throw new AppError(500, "Repost repository is not configured");
    }
    const repost = await this.reposts.findById(repostId);
    if (!repost) {
      throw new AppError(404, "Repost not found");
    }
    if (repost.userId !== userId) {
      throw new AppError(403, "You can only delete your own reposts");
    }
    await this.reposts.deleteById(repostId);
    return { deleted: true, postId: repost.postId };
  }

  async getRepostCount(postId: string) {
    return { postId, repostsCount: await this.reposts?.countByPost(postId) ?? 0 };
  }

  async getRepostUsers(postId: string, limit = 20): Promise<RepostRecord[]> {
    const reposts = await this.reposts?.listByPost(postId, limit) ?? [];
    return reposts.map((repost) => {
      const user = repost.get("user") as UserDocument | undefined;
      return {
        id: repost.id,
        postId: repost.postId,
        user: user ? this.toAuthor(user) : { id: repost.userId, name: "LinkedIn member", headline: "Professional" },
        caption: repost.caption,
        createdAt: repost.createdAt.toISOString()
      };
    });
  }

  async listSendRecipients(user: UserDocument, query = "", limit = 20): Promise<PostRecipient[]> {
    if (!this.users) {
      throw new AppError(500, "User repository is not configured");
    }
    const candidateIds = Array.from(new Set([...(user.connections ?? []), ...(user.followers ?? [])])).slice(0, 100);
    const candidates = await this.users.listByIds(candidateIds);
    const normalizedQuery = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => !normalizedQuery || [candidate.name, candidate.headline].join(" ").toLowerCase().includes(normalizedQuery))
      .slice(0, limit)
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        headline: candidate.headline,
        avatarUrl: candidate.avatarUrl,
        relationship: user.connections?.includes(candidate.id) ? "connection" : "follower"
      }));
  }

  async sendPost(postId: string, sender: UserDocument, receiverIds: string[], message?: string): Promise<SharedPost[]> {
    if (!this.sharedPosts || !this.messages || !this.users) {
      throw new AppError(500, "Shared post dependencies are not configured");
    }
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }
    const uniqueReceiverIds = Array.from(new Set(receiverIds)).filter((id) => id !== sender.id);
    if (!uniqueReceiverIds.length) {
      throw new AppError(400, "Select at least one recipient");
    }
    if (uniqueReceiverIds.length > 10) {
      throw new AppError(400, "You can send a post to at most 10 people at once");
    }

    const allowedRecipients = new Set([...(sender.connections ?? []), ...(sender.followers ?? [])]);
    const unauthorized = uniqueReceiverIds.find((id) => !allowedRecipients.has(id));
    if (unauthorized) {
      throw new AppError(403, "You can only send posts to your connections or followers");
    }

    const receivers = await this.users.listByIds(uniqueReceiverIds);
    const postPreview = this.toPostPreview(post);
    const shared = await Promise.all(
      receivers.map(async (receiver) => {
        const sharedPost = await this.sharedPosts!.create({
          senderId: sender.id,
          receiverId: receiver.id,
          postId,
          message,
          sentAt: new Date(),
          status: "sent"
        });
        const body = message?.trim()
          ? `${sender.name} shared a post: ${message.trim()}`
          : `${sender.name} shared a post with you.`;
        const chatMessage = await this.messages!.sendMessage({
          senderId: sender.id,
          receiverId: receiver.id,
          body,
          sharedPostId: sharedPost.id,
          sharedPostPostId: postId
        });
        sharedPost.status = chatMessage.status;
        sharedPost.conversationId = chatMessage.conversationId;
        sharedPost.messageId = chatMessage.id;
        await this.sharedPosts!.save(sharedPost);
        emitMessage(receiver.id, chatMessage);
        emitMessage(sender.id, chatMessage);
        await this.notifications?.create({
          recipientId: receiver.id,
          actor: this.toAuthor(sender),
          type: "post_share",
          title: `${sender.name} sent you a post`,
          body: post.body.slice(0, 140),
          entityId: sharedPost.id,
          entityType: "shared_post",
          href: `/messages`
        });
        return this.toSharedPost(sharedPost, sender, receiver, postPreview);
      })
    );

    return shared;
  }

  async listSharedPosts(userId: string): Promise<SharedPost[]> {
    if (!this.sharedPosts || !this.users) {
      throw new AppError(500, "Shared post dependencies are not configured");
    }
    const sharedPosts = await this.sharedPosts.listForUser(userId, 60);
    const userIds = Array.from(new Set(sharedPosts.flatMap((item) => [item.senderId, item.receiverId])));
    const postIds = Array.from(new Set(sharedPosts.map((item) => item.postId)));
    const [users, posts] = await Promise.all([this.users.listByIds(userIds), this.posts.listByIds(postIds)]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const postsById = new Map(posts.map((post) => [post.id, post]));
    return sharedPosts.map((item) =>
      this.toSharedPost(
        item,
        usersById.get(item.senderId),
        usersById.get(item.receiverId),
        postsById.get(item.postId) ? this.toPostPreview(postsById.get(item.postId)!) : undefined
      )
    );
  }

  async markSharedPostSeen(sharedPostId: string, userId: string) {
    if (!this.sharedPosts) {
      throw new AppError(500, "Shared post repository is not configured");
    }
    const sharedPost = await this.sharedPosts.findById(sharedPostId);
    if (!sharedPost || sharedPost.receiverId !== userId) {
      throw new AppError(404, "Shared post not found");
    }
    sharedPost.status = "seen";
    sharedPost.seenAt = new Date();
    await this.sharedPosts.save(sharedPost);
    return { id: sharedPost.id, status: sharedPost.status, seenAt: sharedPost.seenAt.toISOString() };
  }

  async deleteSharedPost(sharedPostId: string, userId: string) {
    if (!this.sharedPosts) {
      throw new AppError(500, "Shared post repository is not configured");
    }
    const sharedPost = await this.sharedPosts.findById(sharedPostId);
    if (!sharedPost || (sharedPost.senderId !== userId && sharedPost.receiverId !== userId)) {
      throw new AppError(404, "Shared post not found");
    }
    await this.sharedPosts.deleteById(sharedPostId);
    return { deleted: true };
  }

  async addComment(postId: string, user: UserDocument, commentText: string): Promise<FeedComment> {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    const comment: FeedComment = {
      id: randomUUID(),
      userId: user.id,
      username: user.name,
      profileImage: user.avatarUrl,
      commentText,
      createdAt: new Date().toISOString(),
      canEdit: true,
      canDelete: true
    };
    post.comments = [...(post.comments ?? []), comment];
    await this.posts.save(post);
    await this.notifications?.create({
      recipientId: post.authorId,
      actor: this.toAuthor(user),
      type: "post_comment",
      title: `${user.name} commented on your post`,
      body: commentText,
      entityId: post.id,
      entityType: "comment",
      href: "/"
    });
    return comment;
  }

  async editComment(postId: string, commentId: string, userId: string, commentText: string): Promise<FeedComment> {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    const comment = (post.comments ?? []).find((item) => item.id === commentId);
    if (!comment) {
      throw new AppError(404, "Comment not found");
    }

    const ownerId = this.getCommentUserId(comment);
    if (ownerId !== userId) {
      throw new AppError(403, "You can only edit your own comments");
    }

    const updatedAt = new Date().toISOString();
    post.comments = post.comments.map((item) =>
      item.id === commentId
        ? {
            ...this.toStoredComment(item),
            commentText,
            updatedAt
          }
        : item
    );
    await this.posts.save(post);

    const updated = post.comments.find((item) => item.id === commentId);
    if (!updated) {
      throw new AppError(500, "Comment could not be updated");
    }
    return this.toComment(updated, userId, post.authorId);
  }

  async deleteComment(postId: string, commentId: string, userId: string) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    const comment = (post.comments ?? []).find((item) => item.id === commentId);
    if (!comment) {
      throw new AppError(404, "Comment not found");
    }

    const commentOwnerId = this.getCommentUserId(comment);
    if (commentOwnerId !== userId && post.authorId !== userId) {
      throw new AppError(403, "You can only delete your own comments or comments on your post");
    }

    post.comments = post.comments.filter((item) => item.id !== commentId);
    await this.posts.save(post);
    return { deleted: true };
  }

  async share(postId: string, userId: string) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    post.shares = [...(post.shares ?? []), userId];
    await this.posts.save(post);
    return { sharesCount: post.shares.length };
  }

  async delete(postId: string, userId: string) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    if (post.authorId !== userId) {
      throw new AppError(403, "You can only delete your own posts");
    }

    await this.posts.deleteById(postId);
    return { deleted: true };
  }

  private toFeedPost(
    post: Awaited<ReturnType<PostRepository["findById"]>>,
    currentUserId: string,
    repostCounts = new Map<string, number>(),
    repostedByUser = new Set<string>()
  ): FeedPost {
    if (!post) {
      throw new AppError(404, "Post not found");
    }

      const author = post.get("author");
      if (!author) {
        throw new AppError(500, "Post author could not be loaded");
      }

      return {
        id: post.id,
        postType: "original",
        author: {
          id: author.id,
          name: author.name,
          headline: author.headline,
          avatarUrl: author.avatarUrl
        },
        body: post.body,
        imageUrl: post.imageUrl,
        likesCount: post.likes.length,
        commentsCount: (post.comments ?? []).length,
        sharesCount: repostCounts.get(post.id) ?? (post.shares ?? []).length,
        repostsCount: repostCounts.get(post.id) ?? (post.shares ?? []).length,
        hasLiked: post.likes.includes(currentUserId),
        hasReposted: repostedByUser.has(post.id),
        canDelete: post.authorId === currentUserId,
        comments: (post.comments ?? []).map((comment) => this.toComment(comment, currentUserId, post.authorId)),
        createdAt: post.createdAt.toISOString()
      };
  }

  private toRepostFeedPost(
    repost: RepostDocument,
    currentUserId: string,
    repostCounts = new Map<string, number>(),
    repostedByUser = new Set<string>()
  ): FeedPost {
    const repostUser = repost.get("user") as UserDocument | undefined;
    const originalPost = repost.get("post") as Awaited<ReturnType<PostRepository["findById"]>>;
    if (!originalPost || !repostUser) {
      throw new AppError(500, "Repost data could not be loaded");
    }
    const base = this.toFeedPost(originalPost, currentUserId, repostCounts, repostedByUser);
    return {
      ...base,
      id: repost.id,
      postType: "repost",
      author: this.toAuthor(repostUser),
      body: repost.caption ?? "",
      imageUrl: undefined,
      canDelete: repost.userId === currentUserId,
      repostedBy: this.toAuthor(repostUser),
      repostCaption: repost.caption,
      repostedAt: repost.createdAt.toISOString(),
      originalPost: this.toPostPreview(originalPost),
      comments: [],
      commentsCount: base.commentsCount,
      createdAt: repost.createdAt.toISOString()
    };
  }

  private toAuthor(user: UserDocument): FeedAuthor {
    return {
      id: user.id,
      name: user.name,
      headline: user.headline,
      avatarUrl: user.avatarUrl
    };
  }

  private toPostPreview(post: Awaited<ReturnType<PostRepository["findById"]>>): FeedPostPreview {
    if (!post) {
      throw new AppError(404, "Post not found");
    }
    const author = post.get("author") as UserDocument | undefined;
    return {
      id: post.id,
      author: author
        ? this.toAuthor(author)
        : {
            id: post.authorId,
            name: "LinkedIn member",
            headline: "Professional"
          },
      body: post.body,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString()
    };
  }

  async likePost(postId: string, user: UserDocument) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    const hasLiked = post.likes.includes(user.id);
    if (!hasLiked) {
      post.likes = [...post.likes, user.id];
      await this.posts.save(post);
      await this.notifications?.create({
        recipientId: post.authorId,
        actor: this.toAuthor(user),
        type: "post_like",
        title: `${user.name} liked your post`,
        body: post.body.slice(0, 120),
        entityId: post.id,
        entityType: "post",
        href: "/"
      });
    } else {
      await this.posts.save(post);
    }

    return { hasLiked: true, likesCount: post.likes.length };
  }

  async unlikePost(postId: string, userId: string) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    post.likes = post.likes.filter((id) => id !== userId);
    await this.posts.save(post);
    return { hasLiked: false, likesCount: post.likes.length };
  }

  async toggleLike(postId: string, user: UserDocument) {
    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError(404, "Post not found");
    }

    if (post.likes.includes(user.id)) {
      return this.unlikePost(postId, user.id);
    }

    return this.likePost(postId, user);
  }

  private toStoredComment(comment: FeedComment): FeedComment {
    const raw = comment as FeedComment & { author?: FeedAuthor; body?: string };
    return {
      id: raw.id,
      userId: raw.userId ?? raw.author?.id ?? "",
      username: raw.username ?? raw.author?.name ?? "LinkedIn member",
      profileImage: raw.profileImage ?? raw.author?.avatarUrl,
      commentText: raw.commentText ?? raw.body ?? "",
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    };
  }

  private toComment(comment: FeedComment, currentUserId: string, postAuthorId: string): FeedComment {
    const stored = this.toStoredComment(comment);
    return {
      ...stored,
      canEdit: stored.userId === currentUserId,
      canDelete: stored.userId === currentUserId || postAuthorId === currentUserId
    };
  }

  private getCommentUserId(comment: FeedComment) {
    return this.toStoredComment(comment).userId;
  }

  private toSharedPost(
    sharedPost: SharedPostDocument,
    sender?: UserDocument,
    receiver?: UserDocument,
    postPreview?: FeedPostPreview
  ): SharedPost {
    return {
      id: sharedPost.id,
      sender: sender ? this.toAuthor(sender) : { id: sharedPost.senderId, name: "LinkedIn member", headline: "Professional" },
      receiver: receiver ? this.toAuthor(receiver) : { id: sharedPost.receiverId, name: "LinkedIn member", headline: "Professional" },
      postId: sharedPost.postId,
      postPreview,
      message: sharedPost.message,
      sentAt: sharedPost.sentAt.toISOString(),
      seenAt: sharedPost.seenAt?.toISOString(),
      status: sharedPost.status,
      conversationId: sharedPost.conversationId,
      messageId: sharedPost.messageId
    };
  }

  private feedScore(post: FeedPost) {
    const engagement = post.likesCount * 2 + post.commentsCount * 3 + (post.repostsCount ?? post.sharesCount) * 4;
    const ageHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    return engagement / ageHours + new Date(post.createdAt).getTime() / 1_000_000;
  }
}
