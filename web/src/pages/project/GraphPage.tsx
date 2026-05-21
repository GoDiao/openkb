import { lazy, Suspense, useMemo, useState, type ComponentProps } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { MermaidSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useRoadmap } from "../../hooks/useProjectHub";

type RoadmapGraphProps = ComponentProps<
  typeof import("../../components/roadmap/RoadmapGraph").RoadmapGraph
>;

const RoadmapSection = lazy(() =>
  import("../../components/roadmap/RoadmapGraph").then((m) => ({
    default: function RoadmapSection(props: RoadmapGraphProps) {
      return (
        <>
          <m.RoadmapLegend />
          <m.RoadmapGraph {...props} />
        </>
      );
    },
  })),
);

const MermaidDiagram = lazy(() =>
  import("../../components/docs/MermaidDiagram").then((mod) => ({ default: mod.MermaidDiagram })),
);

function hashPhaseId(): string | null {
  const m = window.location.hash.match(/^#phase-(.+)$/);
  return m?.[1] ?? null;
}

export function GraphPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data, isLoading } = useRoadmap(slug);
  const [exportOpen, setExportOpen] = useState(false);
  const initialSelectedId = useMemo(() => hashPhaseId(), []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <MermaidSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {data && data.enriched_phases.length > 0 ? (
        <Suspense fallback={<MermaidSkeleton />}>
          <RoadmapSection
            slug={slug}
            phases={data.enriched_phases}
            phaseDepths={data.phase_depths}
            initialSelectedId={initialSelectedId}
          />
        </Suspense>
      ) : (
        <div className="surface-panel">
          <EmptyState
            title={t("graph.empty")}
            description={t("graph.compactHint")}
            icon="◎"
          />
        </div>
      )}

      <details
        className="group surface-panel px-5 py-4"
        onToggle={(e) => setExportOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-muted)] transition group-open:text-[var(--accent)] hover:text-[var(--accent)]">
          {t("graph.mermaidExport")}
        </summary>
        {exportOpen && data?.mermaid && (
          <div className="mt-4">
            <Suspense fallback={<MermaidSkeleton className="min-h-[280px]" />}>
              <MermaidDiagram chart={data.mermaid} className="min-h-[280px]" />
            </Suspense>
          </div>
        )}
      </details>
    </motion.div>
  );
}
