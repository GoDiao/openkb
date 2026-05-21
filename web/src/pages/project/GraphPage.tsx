import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { MermaidDiagram } from "../../components/docs/MermaidDiagram";
import { RoadmapGraph, RoadmapLegend } from "../../components/roadmap/RoadmapGraph";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useRoadmap } from "../../hooks/useProjectHub";

function hashPhaseId(): string | null {
  const m = window.location.hash.match(/^#phase-(.+)$/);
  return m?.[1] ?? null;
}

export function GraphPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data, isLoading } = useRoadmap(slug);
  const initialSelectedId = useMemo(() => hashPhaseId(), []);

  if (isLoading) {
    return (
      <div className="surface-panel p-8">
        <DocSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoadmapLegend />

      {data && data.enriched_phases.length > 0 ? (
        <RoadmapGraph
          slug={slug}
          phases={data.enriched_phases}
          phaseDepths={data.phase_depths}
          initialSelectedId={initialSelectedId}
        />
      ) : (
        <p className="m-0 text-sm text-[var(--text-muted)]">{t("graph.empty")}</p>
      )}

      <details className="border-t border-[var(--border-subtle)] pt-4">
        <summary className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
          {t("graph.mermaidExport")}
        </summary>
        {data?.mermaid && (
          <div className="mt-4">
            <MermaidDiagram chart={data.mermaid} className="min-h-[280px]" />
          </div>
        )}
      </details>
    </div>
  );
}
