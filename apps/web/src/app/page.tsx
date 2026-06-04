import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { FeedView } from "@/features/feed/components/feed-view";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <FeedView />
      </MainShell>
    </ProtectedRoute>
  );
}
