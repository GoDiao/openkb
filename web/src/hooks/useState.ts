import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type StatePayload, type StateResponse } from "../api/client";
import { useWatchConnected } from "./useProjectWatch";
import { SYNC_POLL_ACTIVE_MS, SYNC_POLL_IDLE_MS } from "./syncConstants";

export function useProjectState(slug: string) {
  const connected = useWatchConnected();
  return useQuery({
    queryKey: ["state", slug],
    queryFn: () => api<StateResponse>(`/projects/${slug}/state`),
    refetchInterval: connected ? SYNC_POLL_IDLE_MS : SYNC_POLL_ACTIVE_MS,
    enabled: Boolean(slug),
  });
}

export function usePatchState(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<StatePayload> & { updated_by?: string }) =>
      api<StateResponse>(`/projects/${slug}/state`, {
        method: "PATCH",
        body: JSON.stringify({ ...patch, updated_by: "human-ui" }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["state", slug] });
    },
  });
}
