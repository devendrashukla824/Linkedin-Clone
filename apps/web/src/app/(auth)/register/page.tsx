import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { AuthCard } from "@/features/auth/components/auth-card";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="flex items-center gap-3 self-center text-xl font-semibold text-primary">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <BriefcaseBusiness />
          </span>
          ProNet
        </Link>
        <AuthCard mode="register" />
      </div>
    </main>
  );
}
