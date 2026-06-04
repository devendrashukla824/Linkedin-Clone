import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { JobDetailsView } from "@/features/jobs/components/job-details-view";

export default async function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return (
    <ProtectedRoute>
      <MainShell>
        <JobDetailsView jobId={jobId} />
      </MainShell>
    </ProtectedRoute>
  );
}
