import type {
  AdminDashboardOverview,
  AdminModerationStatus,
  AdminReportStatus,
  AdminUser,
  UserRole
} from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export function fetchAdminOverview() {
  return apiClient<AdminDashboardOverview>("/admin/overview");
}

export function updateAdminUser(userId: string, input: { role?: UserRole; status?: AdminUser["status"] }) {
  return apiClient<AdminUser>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function moderateAdminJob(jobId: string, status: AdminModerationStatus) {
  return apiClient<{ id: string; status: AdminModerationStatus }>(`/admin/jobs/${jobId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function moderateAdminPost(postId: string, status: AdminModerationStatus) {
  return apiClient<{ id: string; status: AdminModerationStatus }>(`/admin/posts/${postId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateAdminReport(reportId: string, status: AdminReportStatus) {
  return apiClient<{ id: string; status: AdminReportStatus }>(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
