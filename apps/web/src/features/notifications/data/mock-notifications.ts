import type { NotificationItem } from "@linkedin-clone/shared";

export const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    recipientId: "demo-user",
    actor: {
      id: "user-rohan",
      name: "Rohan Kapoor",
      headline: "Founder at TalentGrid"
    },
    type: "connection_request",
    title: "Rohan Kapoor sent you a connection request",
    body: "Founder at TalentGrid",
    isRead: false,
    entityId: "user-rohan",
    entityType: "connection",
    href: "/network",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "notif-2",
    recipientId: "demo-user",
    actor: {
      id: "user-meera",
      name: "Meera Iyer",
      headline: "Engineering Manager | Platform Reliability"
    },
    type: "post_comment",
    title: "Meera Iyer commented on your post",
    body: "The decision log idea is excellent.",
    isRead: false,
    entityId: "post-1",
    entityType: "comment",
    href: "/",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  },
  {
    id: "notif-3",
    recipientId: "demo-user",
    actor: {
      id: "user-kavya",
      name: "Kavya Nair",
      headline: "Data Scientist at FinAxis"
    },
    type: "job_application",
    title: "Kavya Nair applied to Product Designer",
    body: "A candidate submitted an application for ProNet Labs.",
    isRead: true,
    entityId: "job-3",
    entityType: "job",
    href: "/jobs/job-3",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  }
];
