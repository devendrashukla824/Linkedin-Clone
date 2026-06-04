import type { UpdateProfileInput, UserProfile } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export function fetchProfile() {
  return apiClient<UserProfile>("/profiles/me");
}

export function updateProfile(input: UpdateProfileInput) {
  return apiClient<UserProfile>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiClient<UserProfile>("/profiles/me/avatar", {
    method: "POST",
    body: formData
  });
}

export function uploadCoverImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiClient<UserProfile>("/profiles/me/cover", {
    method: "POST",
    body: formData
  });
}
