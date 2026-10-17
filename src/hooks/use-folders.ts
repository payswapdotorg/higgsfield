"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FolderJson {
  id: string;
  name: string;
  recent_jobs_count: number;
  created_at: string;
}

export function useFolders(enabled = true) {
  return useQuery({
    queryKey: ["folders"],
    queryFn: () => api<{ folders: FolderJson[] }>("/api/folders"),
    enabled,
    retry: false,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return async (name: string) => {
    const res = await api<{ folder: FolderJson }>("/api/folders", { method: "POST", body: { name } });
    await queryClient.invalidateQueries({ queryKey: ["folders"] });
    return res.folder;
  };
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return async (id: string) => {
    await api(`/api/folders/${id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["folders"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    await queryClient.invalidateQueries({ queryKey: ["trash-count"] });
  };
}
