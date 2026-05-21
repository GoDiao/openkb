import { useQuery } from "@tanstack/react-query";
import { api, type StateResponse } from "../api/client";
import type { RoadmapResponse } from "./useProjectHub";

export function useProjectHealth(slug: string) {
  const stateQ = useQuery({
    queryKey: ["state", slug, "card"],
    queryFn: () => api<StateResponse>(`/projects/${slug}/state`),
    staleTime: 30_000,
  });

  const roadmapQ = useQuery({
    queryKey: ["roadmap", slug, "card"],
    queryFn: () => api<RoadmapResponse>(`/projects/${slug}/roadmap`),
    staleTime: 30_000,
  });

  const activePhase = roadmapQ.data?.roadmap.phases.find((p) => p.status === "active");
  const blocker = stateQ.data?.state.now.blocker ?? "";
  const hasBlocker =
    blocker.trim() !== "" &&
    blocker.trim() !== "—" &&
    blocker.trim().toLowerCase() !== "none" &&
    blocker.trim() !== "无";

  return {
    isLoading: stateQ.isLoading || roadmapQ.isLoading,
    activePhaseTitle: activePhase?.title,
    progressPercent: roadmapQ.data?.progress.percent,
    hasBlocker,
    blocker,
  };
}
