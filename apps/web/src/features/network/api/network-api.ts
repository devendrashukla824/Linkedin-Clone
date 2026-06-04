import type { ConnectionSuggestion, NetworkOverview } from "@linkedin-clone/shared";
import { apiClient } from "@/lib/api-client";

export function fetchNetworkOverview() {
  return apiClient<NetworkOverview>("/network");
}

export function sendConnectionRequest(userId: string) {
  return apiClient<ConnectionSuggestion>(`/network/requests/${userId}`, {
    method: "POST"
  });
}

export function acceptConnectionRequest(userId: string) {
  return apiClient<ConnectionSuggestion>(`/network/requests/${userId}/accept`, {
    method: "POST"
  });
}

export function rejectConnectionRequest(userId: string) {
  return apiClient<{ rejected: boolean }>(`/network/requests/${userId}/reject`, {
    method: "POST"
  });
}

export function removeConnection(userId: string) {
  return apiClient<{ removed: boolean }>(`/network/connections/${userId}`, {
    method: "DELETE"
  });
}
