"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import { useLoginMutation, useRegisterMutation } from "@/features/auth/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/stores/auth-store";

interface AuthCardProps {
  mode: "login" | "register";
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    headline: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const isRegister = mode === "register";
  const mutation = isRegister ? registerMutation : loginMutation;
  const isLoading = mutation.isPending;
  const submitLabel = useMemo(() => {
    if (isLoading) {
      return "Please wait...";
    }

    return isRegister ? "Create account" : "Sign in";
  }, [isLoading, isRegister]);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace("/");
    }
  }, [accessToken, hasHydrated, router]);

  function updateField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = isRegister
      ? registerSchema.safeParse({
          name: values.name,
          email: values.email,
          password: values.password,
          headline: values.headline || undefined
        })
      : loginSchema.safeParse({
          email: values.email,
          password: values.password
        });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(flattened).map(([field, messages]) => [field, messages?.[0] ?? "Invalid value"])
        )
      );
      return;
    }

    const onError = (error: Error) => {
      setFormError(error.message);
    };
    const onSuccess = () => {
      router.replace("/");
    };

    if (isRegister) {
      registerMutation.mutate(parsed.data as RegisterFormValues, { onError, onSuccess });
      return;
    }

    loginMutation.mutate(parsed.data as LoginFormValues, { onError, onSuccess });
  }

  function handleDemoSignIn() {
    setFormError(null);
    setFieldErrors({});
    setAuth(DEMO_ACCESS_TOKEN, demoUser);
    router.replace("/");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRegister ? "Create your profile" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isRegister ? "Join a focused professional network." : "Continue building your professional network."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {formError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}
          {isRegister ? (
            <FieldError message={fieldErrors.name}>
              <Input
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                placeholder="Full name"
                autoComplete="name"
              />
            </FieldError>
          ) : null}
          <FieldError message={fieldErrors.email}>
            <Input
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              type="email"
              placeholder="Email address"
              autoComplete="email"
            />
          </FieldError>
          <FieldError message={fieldErrors.password}>
            <Input
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              type="password"
              placeholder="Password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </FieldError>
          {isRegister ? (
            <FieldError message={fieldErrors.headline}>
              <Input
                value={values.headline}
                onChange={(event) => updateField("headline", event.target.value)}
                aria-invalid={Boolean(fieldErrors.headline)}
                placeholder="Professional headline"
                autoComplete="organization-title"
              />
            </FieldError>
          ) : null}
          <Button type="submit" disabled={isLoading}>
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" disabled={isLoading} onClick={handleDemoSignIn}>
            Continue with demo account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isRegister ? "Already have an account?" : "New to ProNet?"}{" "}
          <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-primary">
            {isRegister ? "Sign in" : "Join now"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function FieldError({ children, message }: { children: ReactNode; message?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {children}
      {message ? <p className="text-xs font-medium text-destructive">{message}</p> : null}
    </div>
  );
}
