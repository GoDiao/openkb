import type { EnrichedPhase, RoadmapPhase, RoadmapResponse } from "../hooks/useProjectHub";

function slugifyPlanAnchor(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function computePhaseDepths(phases: RoadmapPhase[]): Record<string, number> {
  const byId = new Map(phases.map((p) => [p.id, p]));
  const memo = new Map<string, number>();

  function depth(id: string): number {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const phase = byId.get(id);
    if (!phase || phase.depends_on.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const d = 1 + Math.max(...phase.depends_on.map((dep) => (byId.has(dep) ? depth(dep) : 0)));
    memo.set(id, d);
    return d;
  }

  for (const p of phases) depth(p.id);
  return Object.fromEntries(memo);
}

function enrichFromPhases(phases: RoadmapPhase[]): EnrichedPhase[] {
  return phases.map((phase) => ({
    ...phase,
    decisions: phase.decisions ?? [],
    task_details: phase.tasks.map((id) => ({
      id,
      title: id,
      status: "backlog",
      priority: "P2",
    })),
    decision_details: (phase.decisions ?? []).map((id) => ({ id, title: id })),
    plan_anchor: slugifyPlanAnchor(phase.plan_ref || phase.title),
  }));
}

/** Backfill fields when API server hasn't been restarted yet. */
export function normalizeRoadmapResponse(raw: RoadmapResponse): RoadmapResponse {
  const phases = raw.roadmap.phases.map((p) => ({
    ...p,
    decisions: p.decisions ?? [],
  }));
  const enriched_phases =
    raw.enriched_phases && raw.enriched_phases.length > 0
      ? raw.enriched_phases
      : enrichFromPhases(phases);
  const phase_depths =
    raw.phase_depths && Object.keys(raw.phase_depths).length > 0
      ? raw.phase_depths
      : computePhaseDepths(phases);
  return {
    ...raw,
    roadmap: { phases },
    enriched_phases,
    phase_depths,
  };
}
