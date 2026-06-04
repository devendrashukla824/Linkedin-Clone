import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { NotificationsView } from "@/features/notifications/components/notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Review real-time updates for likes, comments, connections and job activity."
};

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <NotificationsView />
      </MainShell>
    </ProtectedRoute>
  );
}
