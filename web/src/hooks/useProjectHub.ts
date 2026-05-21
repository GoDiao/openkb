import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { normalizeRoadmapResponse } from "../utils/roadmapNormalize";
import { useWatchConnected } from "./useProjectWatch";
import { SYNC_POLL_ACTIVE_MS, SYNC_POLL_IDLE_MS } from "./syncConstants";

export type PhaseStatus = "done" | "active" | "pending" | "blocked";

export type RoadmapPhase = {
  id: string;
  title: string;
  status: PhaseStatus;
  depends_on: string[];
  plan_ref: string;
  tasks: string[];
  decisions: string[];
};

export type TaskDetail = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

export type DecisionDetail = {
  id: string;
  title: string;
};

export type EnrichedPhase = RoadmapPhase & {
  task_details: TaskDetail[];
  decision_details: DecisionDetail[];
  plan_anchor: string;
};

export type RoadmapResponse = {
  roadmap: { phases: RoadmapPhase[] };
  enriched_phases: EnrichedPhase[];
  phase_depths: Record<string, number>;
  mermaid: string;
  progress: { total: number; done: number; active: number; percent: number };
};

export function useRoadmap(slug: string) {
  const connected = useWatchConnected();
  return useQuery({
    queryKey: ["roadmap", slug],
    queryFn: async () => normalizeRoadmapResponse(await api<RoadmapResponse>(`/projects/${slug}/roadmap`)),
    refetchInterval: connected ? SYNC_POLL_IDLE_MS : SYNC_POLL_ACTIVE_MS,
    enabled: Boolean(slug),
  });
}

export type DocResponse = { kind: string; path: string; content: string; phases?: string[] };

export function useDoc(slug: string, kind: "spec" | "plan") {
  return useQuery({
    queryKey: ["doc", slug, kind],
    queryFn: () => api<DocResponse>(`/projects/${slug}/docs/${kind}`),
    enabled: Boolean(slug),
  });
}

export type DecisionMeta = { id: string; path: string; title: string; phases?: string[] };

export function useDecisions(slug: string) {
  return useQuery({
    queryKey: ["decisions", slug],
    queryFn: () => api<DecisionMeta[]>(`/projects/${slug}/decisions`),
    enabled: Boolean(slug),
  });
}

export function useDecision(slug: string, id: string | null) {
  return useQuery({
    queryKey: ["decision", slug, id],
    queryFn: () => api<DocResponse>(`/projects/${slug}/decisions/${id}`),
    enabled: Boolean(slug && id),
  });
}
