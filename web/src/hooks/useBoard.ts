import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Board, type BoardColumn, type Task, type TaskResponse } from "../api/client";
import { useInvalidateProjectSync } from "./useInvalidateProjectSync";
import { useWatchConnected } from "./useProjectWatch";
import { SYNC_POLL_ACTIVE_MS, SYNC_POLL_IDLE_MS } from "./syncConstants";

/** Poll slower when WebSocket watch is live; 2s fallback when disconnected. */
function useSyncPollInterval() {
  const connected = useWatchConnected();
  return connected ? SYNC_POLL_IDLE_MS : SYNC_POLL_ACTIVE_MS;
}

export function useBoard(slug: string) {
  const pollMs = useSyncPollInterval();
  return useQuery({
    queryKey: ["board", slug],
    queryFn: () => api<Board>(`/projects/${slug}/board`),
    refetchInterval: pollMs,
    enabled: Boolean(slug),
  });
}

export function useTask(slug: string, taskId: string | null) {
  return useQuery({
    queryKey: ["task", slug, taskId],
    queryFn: () => api<TaskResponse>(`/projects/${slug}/tasks/${taskId}`),
    enabled: Boolean(slug && taskId),
  });
}

export function useMoveTask(slug: string) {
  const invalidateSync = useInvalidateProjectSync(slug);
  return useMutation({
    mutationFn: ({ taskId, column }: { taskId: string; column: BoardColumn }) =>
      api<TaskResponse>(`/projects/${slug}/tasks/${taskId}/move`, {
        method: "POST",
        body: JSON.stringify({ column }),
      }),
    onSuccess: () => {
      invalidateSync();
    },
  });
}

export function useUpdateTask(slug: string) {
  const queryClient = useQueryClient();
  const invalidateSync = useInvalidateProjectSync(slug);
  return useMutation({
    mutationFn: ({
      taskId,
      patch,
    }: {
      taskId: string;
      patch: Partial<
        Pick<Task, "title" | "priority" | "assignee" | "branch" | "goal" | "context" | "notes" | "acceptance">
      >;
    }) =>
      api<TaskResponse>(`/projects/${slug}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: (_data, vars) => {
      invalidateSync();
      void queryClient.invalidateQueries({ queryKey: ["task", slug, vars.taskId] });
    },
  });
}

export function useCheckoutTask(slug: string) {
  const queryClient = useQueryClient();
  const invalidateSync = useInvalidateProjectSync(slug);
  return useMutation({
    mutationFn: (taskId: string) =>
      api<TaskResponse>(`/projects/${slug}/tasks/${taskId}/checkout`, {
        method: "POST",
        body: JSON.stringify({ agent_id: "human-ui" }),
      }),
    onSuccess: (_data, taskId) => {
      invalidateSync();
      void queryClient.invalidateQueries({ queryKey: ["task", slug, taskId] });
    },
  });
}

export function useReleaseTask(slug: string) {
  const queryClient = useQueryClient();
  const invalidateSync = useInvalidateProjectSync(slug);
  return useMutation({
    mutationFn: (taskId: string) =>
      api<TaskResponse>(`/projects/${slug}/tasks/${taskId}/release`, {
        method: "POST",
        body: JSON.stringify({ agent_id: "human-ui" }),
      }),
    onSuccess: (_data, taskId) => {
      invalidateSync();
      void queryClient.invalidateQueries({ queryKey: ["task", slug, taskId] });
    },
  });
}

export function useCreateTask(slug: string) {
  const invalidateSync = useInvalidateProjectSync(slug);
  return useMutation({
    mutationFn: (body: { title: string; priority?: Task["priority"] }) =>
      api<TaskResponse>(`/projects/${slug}/tasks`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidateSync();
    },
  });
}
