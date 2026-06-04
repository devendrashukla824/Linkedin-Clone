import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { ProfileView } from "@/features/profile/components/profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your professional profile, skills, experience and contact details."
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <ProfileView />
      </MainShell>
    </ProtectedRoute>
  );
}
