import { Router } from "express";
import {
  addCommentController,
  createPostController,
  deleteCommentController,
  deletePostController,
  deleteRepostController,
  deleteSharedPostController,
  editCommentController,
  getRepostCountController,
  getRepostUsersController,
  likePostController,
  listPostRecipientsController,
  listFeedController,
  listSharedPostsController,
  markSharedPostSeenController,
  repostPostController,
  sendPostController,
  sharePostController,
  toggleLikeController,
  unlikePostController
} from "#src/interfaces/http/controllers/post-controller.js";
import { authMiddleware } from "#src/interfaces/http/middleware/auth-middleware.js";
import { imageUpload } from "#src/interfaces/http/middleware/upload-middleware.js";

export const postRoutes = Router();

postRoutes.use(authMiddleware);
postRoutes.get("/", listFeedController);
postRoutes.post("/", imageUpload.single("image"), createPostController);
postRoutes.get("/recipients", listPostRecipientsController);
postRoutes.get("/shared", listSharedPostsController);
postRoutes.patch("/shared/:sharedPostId/seen", markSharedPostSeenController);
postRoutes.delete("/shared/:sharedPostId", deleteSharedPostController);
postRoutes.delete("/reposts/:repostId", deleteRepostController);
postRoutes.post("/:postId/like", likePostController);
postRoutes.delete("/:postId/like", unlikePostController);
postRoutes.post("/:postId/unlike", unlikePostController);
postRoutes.post("/:postId/toggle-like", toggleLikeController);
postRoutes.post("/:postId/comments", addCommentController);
postRoutes.patch("/:postId/comments/:commentId", editCommentController);
postRoutes.delete("/:postId/comments/:commentId", deleteCommentController);
postRoutes.post("/:postId/share", sharePostController);
postRoutes.post("/:postId/reposts", repostPostController);
postRoutes.get("/:postId/reposts/count", getRepostCountController);
postRoutes.get("/:postId/reposts/users", getRepostUsersController);
postRoutes.post("/:postId/send", sendPostController);
postRoutes.delete("/:postId", deletePostController);
