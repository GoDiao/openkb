import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type { EnrichedPhase } from "../../hooks/useProjectHub";
import { LazyWhenVisible } from "../ui/LazyWhenVisible";
import { MermaidSkeleton } from "../ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";

const RoadmapGraph = lazy(() =>
  import("../roadmap/RoadmapGraph").then((m) => ({ default: m.RoadmapGraph })),
);
const MermaidDiagram = lazy(() =>
  import("../docs/MermaidDiagram").then((m) => ({ default: m.MermaidDiagram })),
);

type Props = {
  slug: string;
  enrichedPhases?: EnrichedPhase[];
  phaseDepths?: Record<string, number>;
  mermaid?: string;
};

export function OverviewRoadmapSection({ slug, enrichedPhases, phaseDepths, mermaid }: Props) {
  const { t } = useI18n();
  const hasGraph = enrichedPhases && enrichedPhases.length > 0;

  if (!hasGraph && !mermaid) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display m-0 text-xl">{t("overview.implRoadmap")}</h2>
        <Link to={`/projects/${slug}/graph`} className="text-sm text-[var(--accent)] no-underline">
          {t("overview.fullscreen")}
        </Link>
      </div>
      <LazyWhenVisible
        testId="overview-roadmap-lazy"
        fallback={<MermaidSkeleton className="min-h-[220px]" />}
      >
        <Suspense fallback={<MermaidSkeleton className="min-h-[220px]" />}>
          {hasGraph ? (
            <RoadmapGraph
              slug={slug}
              phases={enrichedPhases}
              phaseDepths={phaseDepths ?? {}}
              compact
            />
          ) : (
            mermaid && <MermaidDiagram chart={mermaid} />
          )}
        </Suspense>
      </LazyWhenVisible>
      {hasGraph && (
        <p className="m-0 mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          {t("graph.overviewHint")}{" "}
          <Link to={`/projects/${slug}/graph`} className="text-[var(--accent)] no-underline hover:underline">
            {t("graph.openFull")} →
          </Link>
        </p>
      )}
    </section>
  );
}
