import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { MessagesView } from "@/features/messages/components/messages-view";

export const metadata: Metadata = {
  title: "Messages",
  description: "Real-time professional messaging with online, typing and seen states."
};

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <MessagesView />
      </MainShell>
    </ProtectedRoute>
  );
}
