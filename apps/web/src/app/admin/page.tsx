import type { Metadata } from "next";
import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { AdminRoute } from "@/features/admin/components/admin-route";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Role-protected operational dashboard for ProNet platform management.",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <MainShell>
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </MainShell>
    </ProtectedRoute>
  );
}
