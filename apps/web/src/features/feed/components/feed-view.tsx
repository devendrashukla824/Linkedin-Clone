"use client";

import type { FeedComment, FeedPost, PostRecipient } from "@linkedin-clone/shared";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Edit3,
  ImagePlus,
  MessageCircle,
  Repeat2,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { currentUser, suggestions } from "@/features/feed/data/mock-feed";
import {
  useAddComment,
  useCreatePost,
  useDeleteComment,
  useDeletePost,
  useEditComment,
  useFeed,
  usePostRecipients,
  useRepostPost,
  useSendPost,
  useToggleLikePost
} from "@/features/feed/hooks/use-feed";
import { useAuthStore } from "@/stores/auth-store";

export function FeedView() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "360px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="feed-grid gap-4 lg:gap-5">
      <aside className="hidden flex-col gap-4 md:flex">
        <ProfileSummary />
        <Card>
          <CardHeader>
            <CardTitle>Professional tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Button variant="ghost" className="justify-start">
              <Bookmark /> Saved posts
            </Button>
            <Button variant="ghost" className="justify-start">
              <CalendarDays /> Events
            </Button>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        <Composer />
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
          {isFetchingNextPage ? "Loading more posts..." : hasNextPage ? "Scroll for more posts" : "You are all caught up"}
        </div>
      </section>

      <aside className="hidden flex-col gap-4 xl:flex">
        <Card>
          <CardHeader>
            <CardTitle>People you may know</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {suggestions.map((person) => (
              <div key={person.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={person.avatarUrl} />
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{person.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{person.headline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{person.mutualConnections} mutual connections</p>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s brief</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Product teams are increasing design-system hiring.</p>
            <p>Remote-first leadership roles see stronger applicant quality.</p>
            <p>AI tooling demand continues across backend teams.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ProfileSummary() {
  const signedInUser = useAuthStore((state) => state.user) ?? currentUser;

  return (
    <Card className="overflow-hidden">
      <div
        className="h-20 bg-cover bg-center"
        style={{
          backgroundImage: `url(${signedInUser.coverUrl ?? currentUser.coverUrl})`
        }}
      />
      <CardContent className="flex flex-col items-center p-5 text-center">
        <Avatar className="-mt-12 size-20 border-4 border-card">
          <AvatarImage src={signedInUser.avatarUrl} />
          <AvatarFallback>{initials(signedInUser.name)}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-lg font-semibold">{signedInUser.name}</h2>
        <p className="text-sm text-muted-foreground">{signedInUser.headline}</p>
        <Separator className="my-4" />
        <div className="grid w-full grid-cols-2 gap-3 text-left text-sm">
          <div>
            <p className="font-semibold">{signedInUser.connectionsCount.toLocaleString()}</p>
            <p className="text-muted-foreground">Connections</p>
          </div>
          <div>
            <p className="font-semibold">42</p>
            <p className="text-muted-foreground">Profile views</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Composer() {
  const signedInUser = useAuthStore((state) => state.user) ?? currentUser;
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();
  const canPost = body.trim().length > 0 || Boolean(imageFile);

  function clearImage() {
    setImageFile(undefined);
    setImagePreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src={signedInUser.avatarUrl} />
            <AvatarFallback>{initials(signedInUser.name)}</AvatarFallback>
          </Avatar>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Start a professional conversation"
            className="min-h-[76px] resize-none border-0 bg-secondary focus-visible:ring-0"
          />
        </div>
        {imagePreview ? (
          <div className="relative mt-4 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Selected post upload" className="max-h-80 w-full object-cover" />
            <Button className="absolute right-3 top-3" size="icon" variant="secondary" onClick={clearImage} aria-label="Remove image">
              <X />
            </Button>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus /> Media
            </Button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            <Button variant="ghost" size="sm">
              <CalendarDays /> Event
            </Button>
          </div>
          <Button
            size="sm"
            disabled={!canPost || createPost.isPending}
            onClick={() => {
              createPost.mutate({
                body: body.trim() || "Shared an image",
                imageFile,
                optimisticImageUrl: imagePreview
              }, {
                onSuccess: () => {
                  setBody("");
                  clearImage();
                }
              });
            }}
          >
            <Send /> Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const [commentBody, setCommentBody] = useState("");
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | { type: "post"; title: string; description: string }
    | { type: "comment"; commentId: string; title: string; description: string }
    | undefined
  >();
  const likePost = useToggleLikePost();
  const addComment = useAddComment();
  const repostPost = useRepostPost();
  const deletePost = useDeletePost();
  const deleteComment = useDeleteComment();
  const publishedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(post.createdAt)),
    [post.createdAt]
  );

  return (
    <Card id={`post-${post.originalPost?.id ?? post.id}`}>
      <CardContent className="p-0">
        <div className="flex gap-3 p-5">
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} />
            <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight">{post.author.name}</h3>
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck /> Verified
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{post.author.headline}</p>
            <p className="text-xs text-muted-foreground">{publishedAt}</p>
          </div>
          {post.canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete post"
              disabled={deletePost.isPending}
              onClick={() =>
                setConfirmAction({
                  type: "post",
                  title: "Delete post?",
                  description: "This post and all of its comments will be permanently removed."
                })
              }
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
        {post.postType === "repost" ? (
          <div className="px-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground">{post.repostedBy?.name ?? post.author.name} reposted this</p>
            {post.repostCaption ? <p className="mt-3 text-sm leading-6 sm:text-base">{post.repostCaption}</p> : null}
            {post.originalPost ? <OriginalPostCard post={post.originalPost} /> : null}
          </div>
        ) : (
          <p className="px-5 pb-4 text-sm leading-6 sm:text-base">{post.body}</p>
        )}
        {post.postType !== "repost" && (post.imageUrl?.startsWith("blob:") || post.imageUrl?.startsWith("data:")) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={`Image shared by ${post.author.name}`} className="aspect-video w-full object-cover" loading="lazy" decoding="async" />
        ) : post.postType !== "repost" && post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={`Image shared by ${post.author.name}`}
            width={1200}
            height={675}
            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 70vw, 620px"
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="flex items-center justify-between px-5 py-3 text-sm text-muted-foreground">
          <span>{post.likesCount.toLocaleString()} reactions</span>
          <span>
            {post.commentsCount.toLocaleString()} comments - {(post.repostsCount ?? post.sharesCount).toLocaleString()} reposts
          </span>
        </div>
        <Separator />
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button
            variant="ghost"
            size="sm"
            className={post.hasLiked ? "text-primary" : undefined}
            disabled={likePost.isPending}
            onClick={() => likePost.mutate(post)}
          >
            <ThumbsUp /> {post.hasLiked ? "Unlike" : "Like"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((current) => !current)}>
            <MessageCircle /> Comment
          </Button>
          <Button variant="ghost" size="sm" disabled={repostPost.isPending} onClick={() => setShowRepostModal(true)}>
            <Repeat2 /> Repost
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSendModal(true)}>
            <Send /> Send
          </Button>
        </div>
        {showComments ? (
          <div className="border-t bg-secondary/30 p-4">
            <div className="flex flex-col gap-3">
              {post.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onRequestDelete={(commentId) =>
                    setConfirmAction({
                      type: "comment",
                      commentId,
                      title: "Delete comment?",
                      description: "This comment will be removed from the conversation."
                    })
                  }
                />
              ))}
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const body = commentBody.trim();
                  if (!body) {
                    return;
                  }
                  addComment.mutate(
                    { postId: post.id, body },
                    {
                      onSuccess: () => setCommentBody("")
                    }
                  );
                }}
              >
                <Input
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Add a thoughtful comment"
                />
                <Button size="icon" disabled={!commentBody.trim() || addComment.isPending} aria-label="Add comment">
                  <Send />
                </Button>
              </form>
            </div>
          </div>
        ) : null}
        <ConfirmDialog
          open={Boolean(confirmAction)}
          title={confirmAction?.title ?? ""}
          description={confirmAction?.description ?? ""}
          isPending={deletePost.isPending || deleteComment.isPending}
          onCancel={() => setConfirmAction(undefined)}
          onConfirm={() => {
            if (!confirmAction) {
              return;
            }
            if (confirmAction.type === "post") {
              deletePost.mutate(post, { onSuccess: () => setConfirmAction(undefined) });
              return;
            }
            deleteComment.mutate(
              { postId: post.id, commentId: confirmAction.commentId },
              { onSuccess: () => setConfirmAction(undefined) }
            );
          }}
        />
        <RepostModal
          post={post}
          open={showRepostModal}
          isPending={repostPost.isPending}
          error={repostPost.error?.message}
          onClose={() => setShowRepostModal(false)}
          onSubmit={(caption) =>
            repostPost.mutate(
              { post, caption },
              {
                onSuccess: () => setShowRepostModal(false)
              }
            )
          }
        />
        <SendPostModal post={post} open={showSendModal} onClose={() => setShowSendModal(false)} />
      </CardContent>
    </Card>
  );
}

function OriginalPostCard({ post }: { post: NonNullable<FeedPost["originalPost"]> }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border bg-background">
      <div className="flex gap-3 p-4">
        <Avatar className="size-10">
          <AvatarImage src={post.author.avatarUrl} />
          <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{post.author.name}</p>
          <p className="truncate text-xs text-muted-foreground">{post.author.headline}</p>
        </div>
      </div>
      <p className="px-4 pb-4 text-sm leading-6 text-muted-foreground">{post.body}</p>
      {post.imageUrl ? (
        post.imageUrl.startsWith("blob:") || post.imageUrl.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={`Image shared by ${post.author.name}`} className="aspect-video w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <Image
            src={post.imageUrl}
            alt={`Image shared by ${post.author.name}`}
            width={1200}
            height={675}
            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 70vw, 620px"
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
        )
      ) : null}
    </div>
  );
}

function RepostModal({
  post,
  open,
  isPending,
  error,
  onClose,
  onSubmit
}: {
  post: FeedPost;
  open: boolean;
  isPending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (caption?: string) => void;
}) {
  const [caption, setCaption] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-lg border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Repost</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add your thoughts or repost directly to your feed.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close repost dialog">
            <X />
          </Button>
        </div>
        {error ? <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <Textarea className="mt-4 min-h-24" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Add a caption" />
        <OriginalPostCard
          post={
            post.originalPost ?? {
              id: post.id,
              author: post.author,
              body: post.body,
              imageUrl: post.imageUrl,
              createdAt: post.createdAt
            }
          }
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(caption.trim() || undefined)} disabled={isPending}>
            <Repeat2 /> Repost
          </Button>
        </div>
      </div>
    </div>
  );
}

function SendPostModal({ post, open, onClose }: { post: FeedPost; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PostRecipient[]>([]);
  const [message, setMessage] = useState("");
  const recipientsQuery = usePostRecipients(query);
  const sendPost = useSendPost();
  const recipients = recipientsQuery.data?.pages.flatMap((page) => page) ?? [];

  if (!open) {
    return null;
  }

  function toggleRecipient(person: PostRecipient) {
    setSelected((current) =>
      current.some((item) => item.id === person.id) ? current.filter((item) => item.id !== person.id) : [...current, person]
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-lg border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">Send post</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share this post with your connections or followers.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close send dialog">
            <X />
          </Button>
        </div>
        <div className="p-5">
          {sendPost.error ? <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{sendPost.error.message}</p> : null}
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search followers or connections" />
          </div>
          {selected.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.map((person) => (
                <Badge key={person.id} variant="secondary" className="gap-1">
                  {person.name}
                  <button type="button" onClick={() => toggleRecipient(person)} aria-label={`Remove ${person.name}`}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-4 max-h-56 overflow-y-auto rounded-md border">
            {recipientsQuery.isFetching ? <p className="p-3 text-sm text-muted-foreground">Loading people...</p> : null}
            {!recipients.length && !recipientsQuery.isFetching ? <p className="p-3 text-sm text-muted-foreground">No people found.</p> : null}
            {recipients.map((person) => {
              const isSelected = selected.some((item) => item.id === person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-secondary"
                  onClick={() => toggleRecipient(person)}
                >
                  <Avatar className="size-10">
                    <AvatarImage src={person.avatarUrl} />
                    <AvatarFallback>{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{person.headline}</p>
                  </div>
                  <Badge variant={isSelected ? "default" : "outline"}>{isSelected ? "Selected" : person.relationship}</Badge>
                </button>
              );
            })}
          </div>
          <Textarea className="mt-4 min-h-24" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a personal message" />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={sendPost.isPending}>
              Cancel
            </Button>
            <Button
              disabled={!selected.length || sendPost.isPending}
              onClick={() =>
                sendPost.mutate(
                  { post, receiverIds: selected.map((person) => person.id), message: message.trim() || undefined },
                  {
                    onSuccess: () => {
                      setSelected([]);
                      setMessage("");
                      onClose();
                    }
                  }
                )
              }
            >
              <Send /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  onRequestDelete
}: {
  comment: FeedComment;
  postId: string;
  onRequestDelete: (commentId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.commentText);
  const editComment = useEditComment();
  const editedAt = comment.updatedAt ? "Edited" : null;

  return (
    <div className="flex gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={comment.profileImage} />
        <AvatarFallback>{initials(comment.username)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-card px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{comment.username}</p>
              {editedAt ? <p className="text-xs text-muted-foreground">{editedAt}</p> : null}
            </div>
            <div className="flex gap-1">
              {comment.canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Edit comment"
                  onClick={() => {
                    setDraft(comment.commentText);
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="size-4" />
                </Button>
              ) : null}
              {comment.canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label="Delete comment"
                  onClick={() => onRequestDelete(comment.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
          {isEditing ? (
            <form
              className="mt-2 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const body = draft.trim();
                if (!body) {
                  return;
                }
                editComment.mutate(
                  { postId, commentId: comment.id, body },
                  { onSuccess: () => setIsEditing(false) }
                );
              }}
            >
              <Input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Comment text" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!draft.trim() || editComment.isPending}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <p className="break-words text-muted-foreground">{comment.commentText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  isPending,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
