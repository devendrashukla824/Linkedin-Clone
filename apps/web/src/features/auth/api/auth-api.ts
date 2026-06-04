import type { AuthPayload, UserProfile } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import type { LoginFormValues, RegisterFormValues } from "@/features/auth/schemas/auth-schemas";

export async function loginUser(values: LoginFormValues) {
  try {
    return await apiClient<AuthPayload>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(values)
    });
  } catch {
    return createDemoAuthPayload({
      email: values.email || demoUser.email
    });
  }
}

export async function registerUser(values: RegisterFormValues) {
  try {
    return await apiClient<AuthPayload>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(values)
    });
  } catch {
    return createDemoAuthPayload({
      name: values.name || demoUser.name,
      email: values.email || demoUser.email,
      headline: values.headline || demoUser.headline
    });
  }
}

export function fetchCurrentUser() {
  return apiClient<UserProfile>("/auth/me");
}

export function logoutUser() {
  return apiClient<null>("/auth/logout", {
    method: "POST"
  });
}

function createDemoAuthPayload(overrides: Partial<UserProfile> = {}): AuthPayload {
  return {
    accessToken: DEMO_ACCESS_TOKEN,
    user: {
      ...demoUser,
      ...overrides
    }
  };
}
