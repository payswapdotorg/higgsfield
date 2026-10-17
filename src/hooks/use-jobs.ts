"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobJson } from "@/lib/job-shape";

export interface JobsResponse {
  jobs: JobJson[];
  has_more: boolean;
}

export interface JobsQueryParams {
  folderId?: string;
  trash?: boolean;
  jobSetTypes?: string[];
  limit?: number;
  offset?: number;
}

export function jobsQueryString(params: JobsQueryParams = {}): string {
  const qs = new URLSearchParams();
  if (params.folderId) qs.set("folder_id", params.folderId);
  if (params.trash) qs.set("trash", "1");
  for (const t of params.jobSetTypes ?? []) qs.append("job_set_type", t);
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  return qs.toString();
}

/**
 * Job list polling (§3.2): TanStack Query with a 2s interval, 1.15^n backoff capped at 10s,
 * stopping when every visible job is in a terminal state (done/failed).
 */
export function useJobs(params: JobsQueryParams = {}, enabled = true): UseQueryResult<JobsResponse> {
  const qs = jobsQueryString(params);
  return useQuery({
    queryKey: ["jobs", qs],
    queryFn: () => api<JobsResponse>(`/api/jobs/accessible?${qs}`),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data as JobsResponse | undefined;
      if (!data?.jobs?.length) return false;
      const active = data.jobs.some((j) => j.status === "queued" || j.status === "processing");
      if (!active) return false;
      const n = Math.max(1, query.state.dataUpdateCount);
      return Math.min(2000 * Math.pow(1.15, n - 1), 10000);
    },
  });
}

export function jobIsTerminal(job: JobJson): boolean {
  return job.status === "done" || job.status === "failed";
}
