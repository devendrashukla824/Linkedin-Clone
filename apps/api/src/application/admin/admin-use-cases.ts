import type {
  AdminActivityLog,
  AdminDashboardOverview,
  AdminModerationStatus,
  AdminReport,
  AdminReportStatus,
  UserRole
} from "@linkedin-clone/shared";
import { AdminLogModel } from "#src/infrastructure/database/models/admin-log-model.js";
import { JobModel } from "#src/infrastructure/database/models/job-model.js";
import { PostModel } from "#src/infrastructure/database/models/post-model.js";
import { UserModel, type UserDocument } from "#src/infrastructure/database/models/user-model.js";
import { AppError } from "#src/shared/errors/app-error.js";

const seededReports: AdminReport[] = [
  {
    id: "report-1",
    targetType: "post",
    targetLabel: "Hiring update post",
    reason: "Possible misleading job claim",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "report-2",
    targetType: "user",
    targetLabel: "Suspicious recruiter profile",
    reason: "Repeated unsolicited outreach",
    status: "reviewing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export class AdminUseCases {
  async overview(): Promise<AdminDashboardOverview> {
    const [users, jobs, posts, logs, totalUsers, totalJobs, totalPosts] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).limit(8).exec(),
      JobModel.find().sort({ createdAt: -1 }).limit(8).populate("postedBy").exec(),
      PostModel.find().sort({ createdAt: -1 }).limit(8).populate("author").exec(),
      AdminLogModel.find().sort({ createdAt: -1 }).limit(12).exec(),
      UserModel.countDocuments().exec(),
      JobModel.countDocuments().exec(),
      PostModel.countDocuments().exec()
    ]);

    return {
      analytics: {
        totalUsers,
        totalJobs,
        totalPosts,
        pendingReports: seededReports.filter((report) => report.status !== "resolved").length,
        jobApplications: jobs.reduce((total, job) => total + (job.applicants?.length ?? 0), 0),
        weeklyGrowth: buildWeeklyGrowth(totalUsers, totalJobs, totalPosts)
      },
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        role: user.role ?? "user",
        status: user.status ?? "active",
        connectionsCount: user.connections?.length ?? 0,
        createdAt: user.createdAt.toISOString()
      })),
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        applicantsCount: job.applicants?.length ?? 0,
        status: job.status ?? "active",
        postedBy: job.get("postedBy")?.name ?? "Hiring team",
        createdAt: job.createdAt.toISOString()
      })),
      posts: posts.map((post) => {
        const author = post.get("author");
        return {
          id: post.id,
          author: {
            id: author?.id ?? post.authorId,
            name: author?.name ?? "Unknown author",
            headline: author?.headline ?? "Member",
            avatarUrl: author?.avatarUrl
          },
          body: post.body,
          status: post.status ?? "active",
          reportsCount: post.reportsCount ?? 0,
          createdAt: post.createdAt.toISOString()
        };
      }),
      reports: seededReports,
      activityLogs: logs.map((log) => ({
        id: log.id,
        actor: log.actor,
        action: log.action,
        target: log.target,
        createdAt: log.createdAt
      }))
    };
  }

  async updateUser(userId: string, input: { role?: UserRole; status?: "active" | "suspended" }, actor: UserDocument) {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (input.role) {
      user.role = input.role;
    }
    if (input.status) {
      user.status = input.status;
    }
    await user.save();
    await this.log(actor.name, "updated user", user.name);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      role: user.role ?? "user",
      status: user.status ?? "active",
      connectionsCount: user.connections?.length ?? 0,
      createdAt: user.createdAt.toISOString()
    };
  }

  async moderateJob(jobId: string, status: AdminModerationStatus, actor: UserDocument) {
    const job = await JobModel.findById(jobId).exec();
    if (!job) {
      throw new AppError(404, "Job not found");
    }
    job.status = status;
    await job.save();
    await this.log(actor.name, `${status} job`, job.title);
    return { id: job.id, status };
  }

  async moderatePost(postId: string, status: AdminModerationStatus, actor: UserDocument) {
    const post = await PostModel.findById(postId).exec();
    if (!post) {
      throw new AppError(404, "Post not found");
    }
    post.status = status;
    await post.save();
    await this.log(actor.name, `${status} post`, post.body.slice(0, 48));
    return { id: post.id, status };
  }

  async updateReport(reportId: string, status: AdminReportStatus, actor: UserDocument) {
    const report = seededReports.find((item) => item.id === reportId);
    if (!report) {
      throw new AppError(404, "Report not found");
    }
    report.status = status;
    await this.log(actor.name, `${status} report`, report.targetLabel);
    return report;
  }

  private async log(actor: string, action: string, target: string) {
    await AdminLogModel.create({
      actor,
      action,
      target,
      createdAt: new Date().toISOString()
    });
  }
}

function buildWeeklyGrowth(users: number, jobs: number, posts: number) {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => ({
    label,
    users: Math.max(1, Math.round((users / 7) * (index + 1))),
    jobs: Math.max(1, Math.round((jobs / 9) * (index + 1))),
    posts: Math.max(1, Math.round((posts / 8) * (index + 1)))
  }));
}
