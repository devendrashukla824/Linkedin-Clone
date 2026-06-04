"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "admin") {
    return (
      <div className="grid min-h-[calc(100vh-6rem)] place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="grid size-12 place-items-center rounded-md bg-destructive/10 text-destructive">
              <ShieldAlert />
            </div>
            <CardTitle>Admin access required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">Your account does not have permission to manage platform operations.</p>
            <Button asChild>
              <Link href="/">Back to feed</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
