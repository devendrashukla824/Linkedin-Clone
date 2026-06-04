"use client";

import type {
  AdminDashboardOverview,
  AdminModerationStatus,
  AdminReportStatus,
  AdminUser,
  UserRole
} from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOverview,
  moderateAdminJob,
  moderateAdminPost,
  updateAdminReport,
  updateAdminUser
} from "@/features/admin/api/admin-api";
import { mockAdminOverview } from "@/features/admin/data/mock-admin";
import { DEMO_ACCESS_TOKEN } from "@/features/auth/data/demo-user";
import { useAuthStore } from "@/stores/auth-store";

export const adminKey = ["admin", "overview"] as const;

export function useAdminOverview() {
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useQuery({
    queryKey: adminKey,
    queryFn: () => (isDemo ? Promise.resolve(mockAdminOverview) : fetchAdminOverview()),
    initialData: mockAdminOverview,
    retry: false
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: { role?: UserRole; status?: AdminUser["status"] } }) =>
      isDemo
        ? Promise.resolve({
            ...mockAdminOverview.users.find((user) => user.id === userId)!,
            ...input
          })
        : updateAdminUser(userId, input),
    onMutate: async ({ userId, input }) => {
      await queryClient.cancelQueries({ queryKey: adminKey });
      updateAdminCache(queryClient, (overview) => ({
        ...overview,
        users: overview.users.map((user) => (user.id === userId ? { ...user, ...input } : user)),
        activityLogs: prependLog(overview, `updated user`, overview.users.find((user) => user.id === userId)?.name ?? "User")
      }));
    }
  });
}

export function useModerateAdminJob() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: AdminModerationStatus }) =>
      isDemo ? Promise.resolve({ id: jobId, status }) : moderateAdminJob(jobId, status),
    onMutate: async ({ jobId, status }) => {
      await queryClient.cancelQueries({ queryKey: adminKey });
      updateAdminCache(queryClient, (overview) => ({
        ...overview,
        jobs: overview.jobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
        activityLogs: prependLog(overview, `${status} job`, overview.jobs.find((job) => job.id === jobId)?.title ?? "Job")
      }));
    }
  });
}

export function useModerateAdminPost() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ postId, status }: { postId: string; status: AdminModerationStatus }) =>
      isDemo ? Promise.resolve({ id: postId, status }) : moderateAdminPost(postId, status),
    onMutate: async ({ postId, status }) => {
      await queryClient.cancelQueries({ queryKey: adminKey });
      updateAdminCache(queryClient, (overview) => ({
        ...overview,
        posts: overview.posts.map((post) => (post.id === postId ? { ...post, status } : post)),
        activityLogs: prependLog(overview, `${status} post`, overview.posts.find((post) => post.id === postId)?.author.name ?? "Post")
      }));
    }
  });
}

export function useUpdateAdminReport() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: AdminReportStatus }) =>
      isDemo ? Promise.resolve({ id: reportId, status }) : updateAdminReport(reportId, status),
    onMutate: async ({ reportId, status }) => {
      await queryClient.cancelQueries({ queryKey: adminKey });
      updateAdminCache(queryClient, (overview) => ({
        ...overview,
        analytics: {
          ...overview.analytics,
          pendingReports:
            status === "resolved"
              ? Math.max(0, overview.analytics.pendingReports - 1)
              : overview.analytics.pendingReports
        },
        reports: overview.reports.map((report) => (report.id === reportId ? { ...report, status } : report)),
        activityLogs: prependLog(overview, `${status} report`, overview.reports.find((report) => report.id === reportId)?.targetLabel ?? "Report")
      }));
    }
  });
}

function updateAdminCache(queryClient: ReturnType<typeof useQueryClient>, updater: (overview: AdminDashboardOverview) => AdminDashboardOverview) {
  queryClient.setQueryData<AdminDashboardOverview>(adminKey, (overview) => (overview ? updater(overview) : overview));
}

function prependLog(overview: AdminDashboardOverview, action: string, target: string) {
  return [
    {
      id: `log-${Date.now()}`,
      actor: "Devendra Shukla",
      action,
      target,
      createdAt: new Date().toISOString()
    },
    ...overview.activityLogs
  ].slice(0, 12);
}
