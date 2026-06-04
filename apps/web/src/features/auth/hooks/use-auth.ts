"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "@/features/auth/api/auth-api";
import { DEMO_ACCESS_TOKEN } from "@/features/auth/data/demo-user";
import { useAuthStore } from "@/stores/auth-store";

export const sessionQueryKey = ["auth", "me"];

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (payload) => {
      setAuth(payload.accessToken, payload.user);
      queryClient.setQueryData(sessionQueryKey, payload.user);
    }
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (payload) => {
      setAuth(payload.accessToken, payload.user);
      queryClient.setQueryData(sessionQueryKey, payload.user);
    }
  });
}

export function useSession() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken && accessToken !== DEMO_ACCESS_TOKEN),
    retry: false
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error) {
      clearAuth();
    }
  }, [clearAuth, query.error]);

  return query;
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: sessionQueryKey });
    }
  });
}
