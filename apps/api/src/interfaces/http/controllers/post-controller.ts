import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { MessageUseCases } from "#src/application/messages/message-use-cases.js";
import { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import { PostUseCases } from "#src/application/posts/post-use-cases.js";
import { MongoMessageRepository } from "#src/infrastructure/repositories/mongo-message-repository.js";
import { MongoNotificationRepository } from "#src/infrastructure/repositories/mongo-notification-repository.js";
import { MongoPostRepository } from "#src/infrastructure/repositories/mongo-post-repository.js";
import { MongoRepostRepository } from "#src/infrastructure/repositories/mongo-repost-repository.js";
import { MongoSharedPostRepository } from "#src/infrastructure/repositories/mongo-shared-post-repository.js";
import { MongoUserRepository } from "#src/infrastructure/repositories/mongo-user-repository.js";
import { CloudinaryUploadService } from "#src/infrastructure/services/cloudinary-upload-service.js";
import { AppError } from "#src/shared/errors/app-error.js";

const postUseCases = new PostUseCases(
  new MongoPostRepository(),
  new MongoRepostRepository(),
  new MongoSharedPostRepository(),
  new MessageUseCases(new MongoMessageRepository(), new MongoUserRepository()),
  new MongoUserRepository(),
  new NotificationUseCases(new MongoNotificationRepository())
);
const uploads = new CloudinaryUploadService();

const createPostSchema = z.object({
  body: z.string().min(1).max(3000),
  imageUrl: z.string().url().optional()
});

const commentSchema = z.object({
  body: z.string().min(1).max(1200)
});

const repostSchema = z.object({
  caption: z.string().max(1200).optional().or(z.literal(""))
});

const sendPostSchema = z.object({
  receiverIds: z.array(z.string().min(1)).min(1).max(10),
  message: z.string().max(1200).optional().or(z.literal(""))
});

export async function listFeedController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.listFeed(request.user.id, Number(request.query.limit ?? 20), request.query.cursor as string);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createPostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const payload = createPostSchema.parse({
      body: request.body.body,
      imageUrl: request.body.imageUrl || undefined
    });
    const imageUrl = request.file
      ? (await uploads.uploadImage(request.file.buffer, "linkedin-clone/posts")).secure_url
      : payload.imageUrl;
    const data = await postUseCases.create({ ...payload, imageUrl }, request.user);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function toggleLikeController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.toggleLike(request.params.postId, request.user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function likePostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.likePost(request.params.postId, request.user);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function unlikePostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.unlikePost(request.params.postId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function addCommentController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = commentSchema.parse(request.body);
    const data = await postUseCases.addComment(request.params.postId, request.user, payload.body);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function editCommentController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const payload = commentSchema.parse(request.body);
    const data = await postUseCases.editComment(request.params.postId, request.params.commentId, request.user.id, payload.body);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteCommentController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await postUseCases.deleteComment(request.params.postId, request.params.commentId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function sharePostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await postUseCases.share(request.params.postId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function repostPostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const payload = repostSchema.parse(request.body);
    const data = await postUseCases.repost(request.params.postId, request.user, payload.caption?.trim() || undefined);
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteRepostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.deleteRepost(request.params.repostId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRepostCountController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.getRepostCount(request.params.postId);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRepostUsersController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.getRepostUsers(request.params.postId, Number(request.query.limit ?? 20));
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listPostRecipientsController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.listSendRecipients(request.user, String(request.query.query ?? ""), Number(request.query.limit ?? 20));
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function sendPostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const payload = sendPostSchema.parse(request.body);
    const data = await postUseCases.sendPost(
      request.params.postId,
      request.user,
      payload.receiverIds,
      payload.message?.trim() || undefined
    );
    response.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listSharedPostsController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.listSharedPosts(request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markSharedPostSeenController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.markSharedPostSeen(request.params.sharedPostId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteSharedPostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }
    const data = await postUseCases.deleteSharedPost(request.params.sharedPostId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deletePostController(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.user) {
      throw new AppError(401, "Authentication required");
    }

    const data = await postUseCases.delete(request.params.postId, request.user.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
