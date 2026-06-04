import type { FeedComment, FeedPost, PaginatedResponse, PostRecipient, SharedPost } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export interface CreatePostInput {
  body: string;
  imageFile?: File;
  imageUrl?: string;
}

export function fetchFeedPage({ cursor, limit = 3 }: { cursor?: string; limit?: number }) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiClient<PaginatedResponse<FeedPost>>(`/posts?${params.toString()}`);
}

export function createPost(input: CreatePostInput) {
  if (input.imageFile) {
    const formData = new FormData();
    formData.append("body", input.body);
    formData.append("image", input.imageFile);
    return apiClient<FeedPost>("/posts", {
      method: "POST",
      body: formData
    });
  }

  return apiClient<FeedPost>("/posts", {
    method: "POST",
    body: JSON.stringify({ body: input.body, imageUrl: input.imageUrl })
  });
}

export function likePost(postId: string) {
  return apiClient<{ hasLiked: boolean; likesCount: number }>(`/posts/${postId}/like`, {
    method: "POST"
  });
}

export function unlikePost(postId: string) {
  return apiClient<{ hasLiked: boolean; likesCount: number }>(`/posts/${postId}/like`, {
    method: "DELETE"
  });
}

export function addComment(postId: string, body: string) {
  return apiClient<FeedComment>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
}

export function editComment(postId: string, commentId: string, body: string) {
  return apiClient<FeedComment>(`/posts/${postId}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body })
  });
}

export function deleteComment(postId: string, commentId: string) {
  return apiClient<{ deleted: boolean }>(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE"
  });
}

export function sharePost(postId: string) {
  return apiClient<{ sharesCount: number }>(`/posts/${postId}/share`, {
    method: "POST"
  });
}

export function repostPost(postId: string, caption?: string) {
  return apiClient<FeedPost>(`/posts/${postId}/reposts`, {
    method: "POST",
    body: JSON.stringify({ caption })
  });
}

export function deleteRepost(repostId: string) {
  return apiClient<{ deleted: boolean; postId: string }>(`/posts/reposts/${repostId}`, {
    method: "DELETE"
  });
}

export function fetchPostRecipients(query?: string) {
  const params = new URLSearchParams();
  if (query) {
    params.set("query", query);
  }
  return apiClient<PostRecipient[]>(`/posts/recipients${params.toString() ? `?${params.toString()}` : ""}`);
}

export function sendPost(postId: string, receiverIds: string[], message?: string) {
  return apiClient<SharedPost[]>(`/posts/${postId}/send`, {
    method: "POST",
    body: JSON.stringify({ receiverIds, message })
  });
}

export function deletePost(postId: string) {
  return apiClient<{ deleted: boolean }>(`/posts/${postId}`, {
    method: "DELETE"
  });
}
