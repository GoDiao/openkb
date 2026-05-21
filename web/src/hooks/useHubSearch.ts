import { useMemo } from "react";
import { parsePlanSections } from "../components/docs/MarkdownDoc";
import { useBoard } from "./useBoard";
import { useDecisions, useDoc, useRoadmap } from "./useProjectHub";

export type HubSearchKind = "task" | "phase" | "decision" | "plan";

export type HubSearchHit = {
  id: string;
  kind: HubSearchKind;
  label: string;
  hint: string;
  path: string;
};

export function useHubSearch(slug: string) {
  const { data: board, isLoading: boardLoading } = useBoard(slug);
  const { data: roadmap, isLoading: roadmapLoading } = useRoadmap(slug);
  const { data: decisions, isLoading: decisionsLoading } = useDecisions(slug);
  const { data: plan, isLoading: planLoading } = useDoc(slug, "plan");

  const hits = useMemo(() => {
    if (!slug) return [] as HubSearchHit[];
    const base = `/projects/${slug}`;
    const items: HubSearchHit[] = [];

    if (board) {
      for (const tasks of Object.values(board)) {
        for (const task of tasks) {
          items.push({
            id: `task-${task.id}`,
            kind: "task",
            label: task.title,
            hint: `#${task.id} · ${task.status}`,
            path: `${base}/kanban?task=${task.id}`,
          });
        }
      }
    }

    roadmap?.enriched_phases.forEach((phase) => {
      items.push({
        id: `phase-${phase.id}`,
        kind: "phase",
        label: phase.title,
        hint: `${phase.id} · ${phase.status}`,
        path: `${base}/graph#phase-${phase.id}`,
      });
    });

    decisions?.forEach((d) => {
      items.push({
        id: `decision-${d.id}`,
        kind: "decision",
        label: d.title,
        hint: d.id,
        path: `${base}/decisions#${d.id}`,
      });
    });

    if (plan?.content) {
      parsePlanSections(plan.content).forEach((section) => {
        items.push({
          id: `plan-${section.id}`,
          kind: "plan",
          label: section.title,
          hint: section.level === 2 ? "H2" : "H3",
          path: `${base}/plan#${section.id}`,
        });
      });
    }

    return items;
  }, [slug, board, roadmap, decisions, plan]);

  const isLoading = boardLoading || roadmapLoading || decisionsLoading || planLoading;

  return { hits, isLoading };
}

export function filterHubSearch(hits: HubSearchHit[], query: string): HubSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return hits.filter(
    (h) =>
      h.label.toLowerCase().includes(q) ||
      h.hint.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q),
  );
}
