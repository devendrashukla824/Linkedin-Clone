"use client";

import type { UserProfile } from "@linkedin-clone/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  hasHydrated: boolean;
  setAuth: (accessToken: string, user: UserProfile) => void;
  setUser: (user: UserProfile) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "pronet-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
