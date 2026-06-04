"use client";

import type { FeedComment, FeedPost, PaginatedResponse, PostRecipient, UserProfile } from "@linkedin-clone/shared";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  deleteRepost,
  editComment,
  fetchFeedPage,
  fetchPostRecipients,
  likePost,
  repostPost,
  sendPost,
  sharePost,
  unlikePost,
  type CreatePostInput
} from "@/features/feed/api/feed-api";
import { feedPosts } from "@/features/feed/data/mock-feed";
import { mockNetworkOverview } from "@/features/network/data/mock-network";
import { addNotificationToCache, createDemoNotification } from "@/features/notifications/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 3;
export const feedKey = ["feed", "infinite"] as const;
const demoRepostCooldownMs = 10 * 60 * 1000;
const demoRepostTimes = new Map<string, number>();

type FeedData = InfiniteData<PaginatedResponse<FeedPost>>;

export function useFeed() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useInfiniteQuery({
    queryKey: feedKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => (isDemo ? getDemoFeedPage(pageParam) : fetchFeedPage({ cursor: pageParam, limit: PAGE_SIZE })),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.items[lastPage.items.length - 1]?.id : undefined,
    initialData: {
      pages: [getDemoFeedPage(undefined)],
      pageParams: [undefined]
    }
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user) ?? demoUser;
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async (input: CreatePostInput & { optimisticImageUrl?: string }) => {
      if (isDemo) {
        return buildPost(input.body, user, input.optimisticImageUrl ?? input.imageUrl);
      }

      return createPost(input);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      const tempPost = buildPost(input.body, user, input.optimisticImageUrl ?? input.imageUrl, `temp-${Date.now()}`);
      setFeedData(queryClient, (data) => prependPost(data, tempPost));
      return { previous, tempId: tempPost.id };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    },
    onSuccess: (post, _input, context) => {
      setFeedData(queryClient, (data) =>
        mapPosts(data, (currentPost) => (currentPost.id === context?.tempId ? post : currentPost))
      );
    }
  });
}

export function useToggleLikePost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async (post: FeedPost) => {
      if (isDemo) {
        return {
          hasLiked: !post.hasLiked,
          likesCount: post.hasLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1
        };
      }

      return post.hasLiked ? unlikePost(post.id) : likePost(post.id);
    },
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      setFeedData(queryClient, (data) =>
        mapPosts(data, (currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                hasLiked: !currentPost.hasLiked,
                likesCount: currentPost.hasLiked ? Math.max(0, currentPost.likesCount - 1) : currentPost.likesCount + 1
              }
            : currentPost
        )
      );
      return { previous };
    },
    onError: (_error, _post, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    },
    onSuccess: (result, post) => {
      if (isDemo && result.hasLiked) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: post.author,
            type: "post_like",
            title: `${post.author.name} received your like`,
            body: post.body.slice(0, 120),
            entityId: post.id,
            entityType: "post",
            href: "/"
          })
        );
      }
    }
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user) ?? demoUser;
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (isDemo) {
        return buildComment(body, user);
      }

      return addComment(postId, body);
    },
    onMutate: async ({ postId, body }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      const optimisticComment = buildComment(body, user, `temp-comment-${Date.now()}`);
      setFeedData(queryClient, (data) =>
        mapPosts(data, (post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, optimisticComment],
                commentsCount: post.commentsCount + 1
              }
            : post
        )
      );
      return { previous, tempId: optimisticComment.id, postId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    },
    onSuccess: (comment, _input, context) => {
      setFeedData(queryClient, (data) =>
        mapPosts(data, (post) =>
          post.id === context?.postId
            ? {
                ...post,
                comments: post.comments.map((currentComment) =>
                  currentComment.id === context.tempId ? comment : currentComment
                )
              }
            : post
        )
      );
      if (isDemo) {
        const post = queryClient
          .getQueryData<FeedData>(feedKey)
          ?.pages.flatMap((page) => page.items)
          .find((item) => item.id === context?.postId);
        if (post) {
          addNotificationToCache(
            queryClient,
            createDemoNotification({
              actor: post.author,
              type: "post_comment",
              title: `${post.author.name} received your comment`,
              body: comment.commentText,
              entityId: post.id,
              entityType: "comment",
              href: "/"
            })
          );
        }
      }
    }
  });
}

export function useEditComment() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async ({ postId, commentId, body }: { postId: string; commentId: string; body: string }) => {
      if (isDemo) {
        const post = queryClient
          .getQueryData<FeedData>(feedKey)
          ?.pages.flatMap((page) => page.items)
          .find((item) => item.id === postId);
        const comment = post?.comments.find((item) => item.id === commentId);
        if (!comment) {
          throw new Error("Comment not found");
        }
        return { ...comment, commentText: body, updatedAt: new Date().toISOString() };
      }

      return editComment(postId, commentId, body);
    },
    onMutate: async ({ postId, commentId, body }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      const updatedAt = new Date().toISOString();
      setFeedData(queryClient, (data) =>
        mapPosts(data, (post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId ? { ...comment, commentText: body, updatedAt } : comment
                )
              }
            : post
        )
      );
      return { previous, postId, commentId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    },
    onSuccess: (comment, _input, context) => {
      setFeedData(queryClient, (data) =>
        mapPosts(data, (post) =>
          post.id === context?.postId
            ? {
                ...post,
                comments: post.comments.map((item) => (item.id === context.commentId ? comment : item))
              }
            : post
        )
      );
    }
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async ({ postId, commentId }: { postId: string; commentId: string }) =>
      isDemo ? { deleted: true } : deleteComment(postId, commentId),
    onMutate: async ({ postId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      setFeedData(queryClient, (data) =>
        mapPosts(data, (post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((comment) => comment.id !== commentId),
                commentsCount: Math.max(0, post.commentsCount - 1)
              }
            : post
        )
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    }
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async (post: FeedPost) => (isDemo ? { sharesCount: post.sharesCount + 1 } : sharePost(post.id)),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      setFeedData(queryClient, (data) =>
        mapPosts(data, (currentPost) =>
          currentPost.id === post.id ? { ...currentPost, sharesCount: currentPost.sharesCount + 1 } : currentPost
        )
      );
      return { previous };
    },
    onError: (_error, _post, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    }
  });
}

export function useRepostPost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user) ?? demoUser;
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async ({ post, caption }: { post: FeedPost; caption?: string }) => {
      if (!isDemo) {
        return repostPost(getOriginalPostId(post), caption);
      }
      const originalPostId = getOriginalPostId(post);
      const lastRepostAt = demoRepostTimes.get(originalPostId);
      if (lastRepostAt && Date.now() - lastRepostAt < demoRepostCooldownMs) {
        throw new Error("You already reposted this recently. Please wait before reposting again.");
      }
      demoRepostTimes.set(originalPostId, Date.now());
      return buildRepost(post, user, caption);
    },
    onMutate: async ({ post, caption }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      const originalPostId = getOriginalPostId(post);
      const optimisticRepost = buildRepost(post, user, caption, `temp-repost-${Date.now()}`);
      setFeedData(queryClient, (data) =>
        prependPost(
          mapPosts(data, (item) =>
            getOriginalPostId(item) === originalPostId
              ? {
                  ...item,
                  sharesCount: item.sharesCount + 1,
                  repostsCount: (item.repostsCount ?? item.sharesCount) + 1,
                  hasReposted: true
                }
              : item
          ),
          optimisticRepost
        )
      );
      return { previous, tempId: optimisticRepost.id, originalPostId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    },
    onSuccess: (repost, _input, context) => {
      setFeedData(queryClient, (data) =>
        mapPosts(data, (item) => (item.id === context?.tempId ? repost : item))
      );
      if (isDemo) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: repost.repostedBy ?? repost.author,
            type: "post_repost",
            title: "Repost added to your feed",
            body: repost.originalPost?.body.slice(0, 120) ?? repost.body.slice(0, 120),
            entityId: context?.originalPostId,
            entityType: "post",
            href: "/"
          })
        );
      }
    }
  });
}

export function usePostRecipients(query = "") {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useInfiniteQuery({
    queryKey: ["post-recipients", query],
    initialPageParam: undefined as string | undefined,
    queryFn: async () => (isDemo ? getDemoRecipients(query) : fetchPostRecipients(query)),
    getNextPageParam: () => undefined,
    initialData: {
      pages: [getDemoRecipients(query)],
      pageParams: [undefined]
    }
  });
}

export function useSendPost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async ({ post, receiverIds, message }: { post: FeedPost; receiverIds: string[]; message?: string }) =>
      isDemo ? receiverIds.map((id) => ({ id, status: "delivered" as const })) : sendPost(getOriginalPostId(post), receiverIds, message),
    onSuccess: (_result, { post, receiverIds }) => {
      if (isDemo) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: post.author,
            type: "post_share",
            title: "Post sent",
            body: `Sent to ${receiverIds.length} ${receiverIds.length === 1 ? "person" : "people"}.`,
            entityId: getOriginalPostId(post),
            entityType: "post",
            href: "/messages"
          })
        );
      }
    }
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: async (post: FeedPost) =>
      isDemo
        ? { deleted: true, postId: getOriginalPostId(post) }
        : post.postType === "repost"
          ? deleteRepost(post.id)
          : deletePost(post.id),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<FeedData>(feedKey);
      const originalPostId = getOriginalPostId(post);
      setFeedData(queryClient, (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items
            .filter((item) => item.id !== post.id)
            .map((item) =>
              post.postType === "repost" && getOriginalPostId(item) === originalPostId
                ? {
                    ...item,
                    sharesCount: Math.max(0, item.sharesCount - 1),
                    repostsCount: Math.max(0, (item.repostsCount ?? item.sharesCount) - 1),
                    hasReposted: false
                  }
                : item
            )
        }))
      }));
      return { previous };
    },
    onError: (_error, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedKey, context.previous);
      }
    }
  });
}

function getDemoFeedPage(cursor?: string): PaginatedResponse<FeedPost> {
  const startIndex = cursor ? feedPosts.findIndex((post) => post.id === cursor) + 1 : 0;
  const items = feedPosts.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    items,
    page: Math.floor(startIndex / PAGE_SIZE) + 1,
    limit: PAGE_SIZE,
    total: feedPosts.length,
    hasMore: startIndex + PAGE_SIZE < feedPosts.length
  };
}

function setFeedData(queryClient: ReturnType<typeof useQueryClient>, updater: (data: FeedData) => FeedData) {
  queryClient.setQueryData<FeedData>(feedKey, (data) => (data ? updater(data) : data));
}

function prependPost(data: FeedData, post: FeedPost): FeedData {
  const [firstPage, ...restPages] = data.pages;
  return {
    ...data,
    pages: [
      {
        ...firstPage,
        items: [post, ...firstPage.items],
        total: firstPage.total + 1
      },
      ...restPages
    ]
  };
}

function mapPosts(data: FeedData, mapper: (post: FeedPost) => FeedPost): FeedData {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map(mapper)
    }))
  };
}

function buildPost(body: string, user: UserProfile, imageUrl?: string, id = `p_${Date.now()}`): FeedPost {
  return {
    id,
    postType: "original",
    author: {
      id: user.id,
      name: user.name,
      headline: user.headline,
      avatarUrl: user.avatarUrl
    },
    body,
    imageUrl,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    repostsCount: 0,
    hasLiked: false,
    hasReposted: false,
    canDelete: true,
    comments: [],
    createdAt: new Date().toISOString()
  };
}

function buildRepost(post: FeedPost, user: UserProfile, caption?: string, id = `repost_${Date.now()}`): FeedPost {
  const original = post.originalPost ?? {
    id: post.id,
    author: post.author,
    body: post.body,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt
  };
  const author = {
    id: user.id,
    name: user.name,
    headline: user.headline,
    avatarUrl: user.avatarUrl
  };
  return {
    ...post,
    id,
    postType: "repost",
    author,
    body: caption ?? "",
    imageUrl: undefined,
    canDelete: true,
    hasReposted: true,
    repostedBy: author,
    repostCaption: caption,
    repostedAt: new Date().toISOString(),
    originalPost: original,
    comments: [],
    createdAt: new Date().toISOString()
  };
}

function getOriginalPostId(post: FeedPost) {
  return post.originalPost?.id ?? post.id;
}

function getDemoRecipients(query: string): PostRecipient[] {
  const normalizedQuery = query.trim().toLowerCase();
  const people: PostRecipient[] = [
    ...mockNetworkOverview.connections.map((person) => ({
      id: person.id,
      name: person.name,
      headline: person.headline,
      avatarUrl: person.avatarUrl,
      relationship: "connection" as const
    })),
    ...mockNetworkOverview.suggestions.slice(0, 3).map((person) => ({
      id: person.id,
      name: person.name,
      headline: person.headline,
      avatarUrl: person.avatarUrl,
      relationship: "follower" as const
    }))
  ];
  return people.filter((person) => !normalizedQuery || [person.name, person.headline].join(" ").toLowerCase().includes(normalizedQuery));
}

function buildComment(body: string, user: UserProfile, id = `c_${Date.now()}`): FeedComment {
  return {
    id,
    userId: user.id,
    username: user.name,
    profileImage: user.avatarUrl,
    commentText: body,
    createdAt: new Date().toISOString(),
    canEdit: true,
    canDelete: true
  };
}
