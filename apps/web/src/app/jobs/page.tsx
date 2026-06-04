import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { JobsView } from "@/features/jobs/components/jobs-view";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Search, save and apply to professional opportunities on ProNet."
};

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <JobsView />
      </MainShell>
    </ProtectedRoute>
  );
}
