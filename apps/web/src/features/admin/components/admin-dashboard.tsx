"use client";

import type {
  AdminActivityLog,
  AdminJob,
  AdminPost,
  AdminReport,
  AdminUser,
  UserRole
} from "@linkedin-clone/shared";
import { useState, type ReactNode } from "react";
import { Activity, BarChart3, BriefcaseBusiness, FileWarning, Flag, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminOverview,
  useModerateAdminJob,
  useModerateAdminPost,
  useUpdateAdminReport,
  useUpdateAdminUser
} from "@/features/admin/hooks/use-admin";

type AdminTab = "analytics" | "users" | "jobs" | "posts" | "reports" | "logs";

const tabs: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: UsersRound },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "posts", label: "Posts", icon: Flag },
  { id: "reports", label: "Reports", icon: FileWarning },
  { id: "logs", label: "Logs", icon: Activity }
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const { data } = useAdminOverview();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage platform users, jobs, posts, reports and operations.</p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <ShieldCheck className="size-4" /> RBAC protected
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Users" value={data.analytics.totalUsers} icon={UsersRound} />
        <Metric title="Jobs" value={data.analytics.totalJobs} icon={BriefcaseBusiness} />
        <Metric title="Posts" value={data.analytics.totalPosts} icon={Flag} />
        <Metric title="Reports" value={data.analytics.pendingReports} icon={FileWarning} />
        <Metric title="Applications" value={data.analytics.jobApplications} icon={Activity} />
      </div>

      <Card>
        <CardContent className="flex gap-2 overflow-x-auto p-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon /> {tab.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {activeTab === "analytics" ? <AnalyticsPanel data={data.analytics.weeklyGrowth} /> : null}
      {activeTab === "users" ? <UsersPanel users={data.users} /> : null}
      {activeTab === "jobs" ? <JobsPanel jobs={data.jobs} /> : null}
      {activeTab === "posts" ? <PostsPanel posts={data.posts} /> : null}
      {activeTab === "reports" ? <ReportsPanel reports={data.reports} /> : null}
      {activeTab === "logs" ? <LogsPanel logs={data.activityLogs} /> : null}
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof UsersRound }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon />
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel({ data }: { data: Array<{ label: string; users: number; jobs: number; posts: number }> }) {
  const maxValue = Math.max(...data.flatMap((item) => [item.users, item.jobs, item.posts]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly growth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.label} className="grid gap-2 md:grid-cols-[48px_1fr] md:items-center">
            <p className="text-sm font-medium">{item.label}</p>
            <div className="grid gap-2">
              <Bar label="Users" value={item.users} max={maxValue} />
              <Bar label="Jobs" value={item.jobs} max={maxValue} />
              <Bar label="Posts" value={item.posts} max={maxValue} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="grid grid-cols-[64px_1fr_48px] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} />
      </div>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  );
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  const updateUser = useUpdateAdminUser();

  return (
    <TableCard title="User management">
      {users.map((user) => (
        <Row key={user.id}>
          <div className="min-w-0">
            <p className="font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.connectionsCount} connections</p>
          </div>
          <StatusBadge value={user.role} />
          <StatusBadge value={user.status} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => updateUser.mutate({ userId: user.id, input: { role: nextRole(user.role) } })}>
              {user.role === "admin" ? "Make user" : "Make admin"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateUser.mutate({ userId: user.id, input: { status: user.status === "active" ? "suspended" : "active" } })}>
              {user.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </div>
        </Row>
      ))}
    </TableCard>
  );
}

function JobsPanel({ jobs }: { jobs: AdminJob[] }) {
  const moderateJob = useModerateAdminJob();

  return (
    <TableCard title="Job management">
      {jobs.map((job) => (
        <Row key={job.id}>
          <div className="min-w-0">
            <p className="font-semibold">{job.title}</p>
            <p className="truncate text-sm text-muted-foreground">{job.company} · {job.location}</p>
            <p className="text-xs text-muted-foreground">{job.applicantsCount} applicants · Posted by {job.postedBy}</p>
          </div>
          <StatusBadge value={job.status} />
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            <Button size="sm" variant="outline" onClick={() => moderateJob.mutate({ jobId: job.id, status: "active" })}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => moderateJob.mutate({ jobId: job.id, status: "flagged" })}>Flag</Button>
            <Button size="sm" variant="outline" onClick={() => moderateJob.mutate({ jobId: job.id, status: "hidden" })}>Hide</Button>
          </div>
        </Row>
      ))}
    </TableCard>
  );
}

function PostsPanel({ posts }: { posts: AdminPost[] }) {
  const moderatePost = useModerateAdminPost();

  return (
    <TableCard title="Post moderation">
      {posts.map((post) => (
        <Row key={post.id}>
          <div className="min-w-0">
            <p className="font-semibold">{post.author.name}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
            <p className="text-xs text-muted-foreground">{post.reportsCount} reports</p>
          </div>
          <StatusBadge value={post.status} />
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            <Button size="sm" variant="outline" onClick={() => moderatePost.mutate({ postId: post.id, status: "active" })}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => moderatePost.mutate({ postId: post.id, status: "flagged" })}>Flag</Button>
            <Button size="sm" variant="outline" onClick={() => moderatePost.mutate({ postId: post.id, status: "hidden" })}>Hide</Button>
          </div>
        </Row>
      ))}
    </TableCard>
  );
}

function ReportsPanel({ reports }: { reports: AdminReport[] }) {
  const updateReport = useUpdateAdminReport();

  return (
    <TableCard title="Reports">
      {reports.map((report) => (
        <Row key={report.id}>
          <div className="min-w-0">
            <p className="font-semibold">{report.targetLabel}</p>
            <p className="text-sm text-muted-foreground">{report.reason}</p>
            <p className="text-xs text-muted-foreground">{report.targetType}</p>
          </div>
          <StatusBadge value={report.status} />
          <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
            <Button size="sm" variant="outline" onClick={() => updateReport.mutate({ reportId: report.id, status: "reviewing" })}>Review</Button>
            <Button size="sm" variant="outline" onClick={() => updateReport.mutate({ reportId: report.id, status: "resolved" })}>Resolve</Button>
          </div>
        </Row>
      ))}
    </TableCard>
  );
}

function LogsPanel({ logs }: { logs: AdminActivityLog[] }) {
  return (
    <TableCard title="Activity logs">
      {logs.map((log) => (
        <Row key={log.id}>
          <div className="min-w-0">
            <p className="font-semibold">{log.actor}</p>
            <p className="text-sm text-muted-foreground">{log.action}</p>
          </div>
          <p className="text-sm text-muted-foreground md:col-span-2">{log.target}</p>
          <p className="text-right text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
        </Row>
      ))}
    </TableCard>
  );
}

function TableCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_120px_260px] md:items-center">{children}</div>;
}

function StatusBadge({ value }: { value: string }) {
  const isRisk = value === "hidden" || value === "suspended" || value === "flagged" || value === "open";
  const variant = value === "active" || value === "admin" || value === "resolved" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className={isRisk ? "border-destructive/40 bg-destructive/10 text-destructive" : undefined}>
      {value}
    </Badge>
  );
}

function nextRole(role: UserRole): UserRole {
  return role === "admin" ? "user" : "admin";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
