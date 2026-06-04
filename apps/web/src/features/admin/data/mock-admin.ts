import type { AdminDashboardOverview } from "@linkedin-clone/shared";
import { feedPosts } from "@/features/feed/data/mock-feed";
import { mockJobs } from "@/features/jobs/data/mock-jobs";

export const mockAdminOverview: AdminDashboardOverview = {
  analytics: {
    totalUsers: 1284,
    totalJobs: 94,
    totalPosts: 2380,
    pendingReports: 7,
    jobApplications: 416,
    weeklyGrowth: [
      { label: "Mon", users: 42, jobs: 7, posts: 118 },
      { label: "Tue", users: 58, jobs: 11, posts: 126 },
      { label: "Wed", users: 73, jobs: 15, posts: 142 },
      { label: "Thu", users: 96, jobs: 19, posts: 160 },
      { label: "Fri", users: 124, jobs: 24, posts: 176 },
      { label: "Sat", users: 138, jobs: 21, posts: 154 },
      { label: "Sun", users: 151, jobs: 28, posts: 188 }
    ]
  },
  users: [
    {
      id: "demo-user",
      name: "Devendra Shukla",
      email: "devendrashukla824@gmail.com",
      headline: "Frontend developer",
      role: "admin",
      status: "active",
      connectionsCount: 842,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
    },
    {
      id: "user-rohan",
      name: "Rohan Kapoor",
      email: "rohan@talentgrid.example",
      headline: "Founder at TalentGrid",
      role: "user",
      status: "active",
      connectionsCount: 530,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 38).toISOString()
    },
    {
      id: "user-kavya",
      name: "Kavya Nair",
      email: "kavya@finaxis.example",
      headline: "Data Scientist at FinAxis",
      role: "user",
      status: "suspended",
      connectionsCount: 218,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString()
    }
  ],
  jobs: mockJobs.slice(0, 4).map((job, index) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    applicantsCount: job.applicantsCount,
    status: index === 1 ? "flagged" : "active",
    postedBy: job.postedBy.name,
    createdAt: job.createdAt
  })),
  posts: feedPosts.slice(0, 3).map((post, index) => ({
    id: post.id,
    author: post.author,
    body: post.body,
    status: index === 0 ? "active" : index === 1 ? "flagged" : "hidden",
    reportsCount: index * 2,
    createdAt: post.createdAt
  })),
  reports: [
    {
      id: "report-1",
      targetType: "post",
      targetLabel: "Hiring update post",
      reason: "Possible misleading job claim",
      status: "open",
      createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString()
    },
    {
      id: "report-2",
      targetType: "user",
      targetLabel: "Suspicious recruiter profile",
      reason: "Repeated unsolicited outreach",
      status: "reviewing",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
      id: "report-3",
      targetType: "job",
      targetLabel: "Backend Engineer",
      reason: "Salary mismatch reported by applicants",
      status: "resolved",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ],
  activityLogs: [
    {
      id: "log-1",
      actor: "Devendra Shukla",
      action: "hid post",
      target: "Product launch discussion",
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: "log-2",
      actor: "Devendra Shukla",
      action: "resolved report",
      target: "Backend Engineer",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: "log-3",
      actor: "System",
      action: "flagged job",
      target: "Remote Product Role",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    }
  ]
};
