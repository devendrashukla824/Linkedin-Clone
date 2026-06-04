import type { ApiResponse } from "@linkedin-clone/shared";
import { useAuthStore } from "@/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Cannot reach the API server. Start the backend on port 5000, then try again.");
  }

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? "Something went wrong");
  }

  return payload.data as T;
}
