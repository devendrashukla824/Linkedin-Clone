export type ID = string;
export type UserRole = "user" | "admin";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface UserProfile {
  id: ID;
  role?: UserRole;
  status?: "active" | "suspended";
  name: string;
  headline: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  about?: string;
  location?: string;
  company?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  contact: ContactDetails;
  connectionsCount: number;
  createdAt: string;
}

export interface ContactDetails {
  email: string;
  phone?: string;
  website?: string;
  linkedIn?: string;
  location?: string;
}

export interface ExperienceItem {
  id: ID;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface EducationItem {
  id: ID;
  school: string;
  degree: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

export interface UpdateProfileInput {
  name?: string;
  headline?: string;
  about?: string;
  location?: string;
  company?: string;
  skills?: string[];
  contact?: Partial<ContactDetails>;
  experience?: ExperienceItem[];
  education?: EducationItem[];
}

export interface AuthPayload {
  user: UserProfile;
  accessToken: string;
}

export interface FeedAuthor {
  id: ID;
  name: string;
  headline: string;
  avatarUrl?: string;
}

export interface FeedPost {
  id: ID;
  postType?: "original" | "repost";
  author: FeedAuthor;
  body: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount?: number;
  hasLiked: boolean;
  hasReposted?: boolean;
  canDelete?: boolean;
  repostedBy?: FeedAuthor;
  repostCaption?: string;
  repostedAt?: string;
  originalPost?: FeedPostPreview;
  comments: FeedComment[];
  createdAt: string;
}

export interface FeedPostPreview {
  id: ID;
  author: FeedAuthor;
  body: string;
  imageUrl?: string;
  createdAt: string;
}

export interface FeedComment {
  id: ID;
  userId: ID;
  username: string;
  profileImage?: string;
  commentText: string;
  createdAt: string;
  updatedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface ConnectionSuggestion {
  id: ID;
  name: string;
  headline: string;
  avatarUrl?: string;
  location?: string;
  followersCount: number;
  mutualConnections: number;
  status: ConnectionStatus;
}

export type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected";

export interface ConnectionRequest {
  id: ID;
  from: ConnectionSuggestion;
  createdAt: string;
}

export interface NetworkOverview {
  suggestions: ConnectionSuggestion[];
  incomingRequests: ConnectionRequest[];
  connections: ConnectionSuggestion[];
  followersCount: number;
  connectionsCount: number;
}

export interface NotificationItem {
  id: ID;
  recipientId: ID;
  actor?: FeedAuthor;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  entityId?: ID;
  entityType?: "post" | "comment" | "connection" | "job" | "shared_post" | "message";
  href?: string;
  createdAt: string;
}

export type NotificationType =
  | "post_like"
  | "post_comment"
  | "post_repost"
  | "post_share"
  | "connection_request"
  | "connection_accepted"
  | "job_application"
  | "system";

export interface NotificationsOverview {
  items: NotificationItem[];
  unreadCount: number;
}

export interface ChatParticipant {
  id: ID;
  name: string;
  headline: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export type MessageStatus = "sent" | "delivered" | "seen";

export interface ChatMessage {
  id: ID;
  conversationId: ID;
  senderId: ID;
  receiverId: ID;
  body: string;
  status: MessageStatus;
  sharedPost?: SharedPostMessage;
  createdAt: string;
  seenAt?: string;
}

export interface SharedPostMessage {
  id: ID;
  postId: ID;
  postPreview?: FeedPostPreview;
}

export interface ChatConversation {
  id: ID;
  participant: ChatParticipant;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface MessagingOverview {
  conversations: ChatConversation[];
  activeConversation?: {
    conversation: ChatConversation;
    messages: ChatMessage[];
  };
}

export interface ServerToClientEvents {
  "presence:update": (payload: { userId: ID; isOnline: boolean; lastSeenAt?: string }) => void;
  "message:new": (message: ChatMessage) => void;
  "message:seen": (payload: { conversationId: ID; messageIds: ID[]; seenAt: string }) => void;
  "typing:update": (payload: { conversationId: ID; userId: ID; isTyping: boolean }) => void;
  "notification:new": (notification: NotificationItem) => void;
  "notification:read": (payload: { notificationIds: ID[]; unreadCount: number }) => void;
}

export interface ClientToServerEvents {
  "conversation:join": (payload: { conversationId: ID }) => void;
  "message:send": (
    payload: { conversationId?: ID; receiverId: ID; body: string },
    callback: (response: { success: boolean; message?: ChatMessage; error?: string }) => void
  ) => void;
  "message:seen": (payload: { conversationId: ID; messageIds: ID[] }) => void;
  "typing:update": (payload: { conversationId: ID; receiverId: ID; isTyping: boolean }) => void;
}

export interface RepostRecord {
  id: ID;
  postId: ID;
  user: FeedAuthor;
  caption?: string;
  createdAt: string;
}

export type SharedPostStatus = "sent" | "delivered" | "seen";

export interface SharedPost {
  id: ID;
  sender: FeedAuthor;
  receiver: FeedAuthor;
  postId: ID;
  postPreview?: FeedPostPreview;
  message?: string;
  sentAt: string;
  seenAt?: string;
  status: SharedPostStatus;
  conversationId?: ID;
  messageId?: ID;
}

export interface PostRecipient {
  id: ID;
  name: string;
  headline: string;
  avatarUrl?: string;
  relationship: "connection" | "follower";
}

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type WorkplaceType = "Remote" | "Hybrid" | "On-site";
export type ExperienceLevel = "Internship" | "Entry level" | "Associate" | "Mid-Senior level" | "Director";

export interface JobAuthor {
  id: ID;
  name: string;
  headline: string;
  avatarUrl?: string;
}

export interface JobListing {
  id: ID;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  workplaceType: WorkplaceType;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  postedBy: JobAuthor;
  applicantsCount: number;
  viewsCount: number;
  hasApplied: boolean;
  isSaved: boolean;
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  query?: string;
  location?: string;
  workplaceType?: WorkplaceType | "All";
  jobType?: JobType | "All";
  experienceLevel?: ExperienceLevel | "All";
  sort?: "recent" | "relevant" | "applicants";
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  workplaceType: WorkplaceType;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryRange?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
}

export type UpdateJobInput = Partial<CreateJobInput>;

export type JobApplicationStatus = "Applied" | "Reviewing" | "Shortlisted" | "Rejected" | "Hired";

export interface JobApplication {
  id: ID;
  applicantName: string;
  phoneNumber: string;
  email: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experience?: string;
  coverLetter?: string;
  resumeUrl: string;
  resumeFileName?: string;
  jobId: ID;
  jobTitle?: string;
  applicantUserId: ID;
  status: JobApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
}

export interface CreateJobApplicationInput {
  applicantName: string;
  phoneNumber: string;
  email: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experience?: string;
  coverLetter?: string;
}

export type AdminModerationStatus = "active" | "hidden" | "flagged";
export type AdminReportStatus = "open" | "reviewing" | "resolved";

export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  headline: string;
  role: UserRole;
  status: "active" | "suspended";
  connectionsCount: number;
  createdAt: string;
}

export interface AdminJob {
  id: ID;
  title: string;
  company: string;
  location: string;
  applicantsCount: number;
  status: AdminModerationStatus;
  postedBy: string;
  createdAt: string;
}

export interface AdminPost {
  id: ID;
  author: FeedAuthor;
  body: string;
  status: AdminModerationStatus;
  reportsCount: number;
  createdAt: string;
}

export interface AdminReport {
  id: ID;
  targetType: "user" | "post" | "job";
  targetLabel: string;
  reason: string;
  status: AdminReportStatus;
  createdAt: string;
}

export interface AdminActivityLog {
  id: ID;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalJobs: number;
  totalPosts: number;
  pendingReports: number;
  jobApplications: number;
  weeklyGrowth: Array<{ label: string; users: number; jobs: number; posts: number }>;
}

export interface AdminDashboardOverview {
  analytics: AdminAnalytics;
  users: AdminUser[];
  jobs: AdminJob[];
  posts: AdminPost[];
  reports: AdminReport[];
  activityLogs: AdminActivityLog[];
}
