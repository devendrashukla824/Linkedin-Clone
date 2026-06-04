import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container pb-24 pt-4 sm:pt-6 lg:pb-6" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
