"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTrashCount(enabled = true) {
  return useQuery({
    queryKey: ["trash-count"],
    queryFn: () => api<{ count: number }>("/api/trash/library/count"),
    enabled,
    retry: false,
  });
}

export function useInvalidateJobQueries() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    await queryClient.invalidateQueries({ queryKey: ["trash-count"] });
    await queryClient.invalidateQueries({ queryKey: ["folders"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    await queryClient.invalidateQueries({ queryKey: ["free-gens"] });
    await queryClient.invalidateQueries({ queryKey: ["feed"] });
  };
}
