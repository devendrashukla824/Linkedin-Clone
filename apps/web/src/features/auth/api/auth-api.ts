import type { AuthPayload, UserProfile } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";
import type { LoginFormValues, RegisterFormValues } from "@/features/auth/schemas/auth-schemas";

export function loginUser(values: LoginFormValues) {
  return apiClient<AuthPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(values)
  });
}

export function registerUser(values: RegisterFormValues) {
  return apiClient<AuthPayload>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(values)
  });
}

export function fetchCurrentUser() {
  return apiClient<UserProfile>("/auth/me");
}

export function logoutUser() {
  return apiClient<null>("/auth/logout", {
    method: "POST"
  });
}
