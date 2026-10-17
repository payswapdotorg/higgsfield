"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  plan_type: string;
  created_at: string;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => api<{ user: SessionUser }>("/api/auth/session"),
    staleTime: 30_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return async (email: string) => {
    await api<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: { email } });
    await queryClient.invalidateQueries();
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    queryClient.clear();
  };
}
