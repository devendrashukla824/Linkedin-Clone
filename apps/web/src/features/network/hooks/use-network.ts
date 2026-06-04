"use client";

import type { ConnectionSuggestion, NetworkOverview } from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEMO_ACCESS_TOKEN } from "@/features/auth/data/demo-user";
import {
  acceptConnectionRequest,
  fetchNetworkOverview,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest
} from "@/features/network/api/network-api";
import { mockNetworkOverview } from "@/features/network/data/mock-network";
import { addNotificationToCache, createDemoNotification } from "@/features/notifications/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

export const networkKey = ["network", "overview"] as const;

export function useNetworkOverview() {
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useQuery({
    queryKey: networkKey,
    queryFn: () => (isDemo ? Promise.resolve(mockNetworkOverview) : fetchNetworkOverview()),
    initialData: mockNetworkOverview,
    retry: false
  });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (person: ConnectionSuggestion) =>
      isDemo ? Promise.resolve({ ...person, status: "pending_sent" as const }) : sendConnectionRequest(person.id),
    onMutate: async (person) => {
      await queryClient.cancelQueries({ queryKey: networkKey });
      const previous = queryClient.getQueryData<NetworkOverview>(networkKey);
      updateNetwork(queryClient, (overview) => ({
        ...overview,
        suggestions: overview.suggestions.map((item) =>
          item.id === person.id ? { ...item, status: "pending_sent" } : item
        )
      }));
      return { previous };
    },
    onError: (_error, _person, context) => restore(queryClient, context?.previous),
    onSuccess: (_result, person) => {
      if (isDemo) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: person,
            type: "connection_request",
            title: `Connection request sent to ${person.name}`,
            body: `${person.headline} will see your invitation.`,
            entityId: person.id,
            entityType: "connection",
            href: "/network"
          })
        );
      }
    }
  });
}

export function useAcceptConnectionRequest() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (person: ConnectionSuggestion) =>
      isDemo ? Promise.resolve({ ...person, status: "connected" as const }) : acceptConnectionRequest(person.id),
    onMutate: async (person) => {
      await queryClient.cancelQueries({ queryKey: networkKey });
      const previous = queryClient.getQueryData<NetworkOverview>(networkKey);
      updateNetwork(queryClient, (overview) => ({
        ...overview,
        incomingRequests: overview.incomingRequests.filter((request) => request.from.id !== person.id),
        connections: [{ ...person, status: "connected" }, ...overview.connections],
        connectionsCount: overview.connectionsCount + 1
      }));
      return { previous };
    },
    onError: (_error, _person, context) => restore(queryClient, context?.previous),
    onSuccess: (_result, person) => {
      if (isDemo) {
        addNotificationToCache(
          queryClient,
          createDemoNotification({
            actor: person,
            type: "connection_accepted",
            title: `You accepted ${person.name}`,
            body: "Your professional network just grew.",
            entityId: person.id,
            entityType: "connection",
            href: "/network"
          })
        );
      }
    }
  });
}

export function useRejectConnectionRequest() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (person: ConnectionSuggestion) =>
      isDemo ? Promise.resolve({ rejected: true }) : rejectConnectionRequest(person.id),
    onMutate: async (person) => {
      await queryClient.cancelQueries({ queryKey: networkKey });
      const previous = queryClient.getQueryData<NetworkOverview>(networkKey);
      updateNetwork(queryClient, (overview) => ({
        ...overview,
        incomingRequests: overview.incomingRequests.filter((request) => request.from.id !== person.id)
      }));
      return { previous };
    },
    onError: (_error, _person, context) => restore(queryClient, context?.previous)
  });
}

export function useRemoveConnection() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.accessToken) === DEMO_ACCESS_TOKEN;

  return useMutation({
    mutationFn: (person: ConnectionSuggestion) =>
      isDemo ? Promise.resolve({ removed: true }) : removeConnection(person.id),
    onMutate: async (person) => {
      await queryClient.cancelQueries({ queryKey: networkKey });
      const previous = queryClient.getQueryData<NetworkOverview>(networkKey);
      updateNetwork(queryClient, (overview) => ({
        ...overview,
        connections: overview.connections.filter((connection) => connection.id !== person.id),
        connectionsCount: Math.max(0, overview.connectionsCount - 1),
        suggestions: [{ ...person, status: "none" }, ...overview.suggestions]
      }));
      return { previous };
    },
    onError: (_error, _person, context) => restore(queryClient, context?.previous)
  });
}

function updateNetwork(queryClient: ReturnType<typeof useQueryClient>, updater: (overview: NetworkOverview) => NetworkOverview) {
  queryClient.setQueryData<NetworkOverview>(networkKey, (overview) => (overview ? updater(overview) : overview));
}

function restore(queryClient: ReturnType<typeof useQueryClient>, previous?: NetworkOverview) {
  if (previous) {
    queryClient.setQueryData(networkKey, previous);
  }
}
