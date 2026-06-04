import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { NetworkView } from "@/features/network/components/network-view";

export const metadata: Metadata = {
  title: "Network",
  description: "Discover, request and manage professional connections."
};

export default function NetworkPage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <NetworkView />
      </MainShell>
    </ProtectedRoute>
  );
}
