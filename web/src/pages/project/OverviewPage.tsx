import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BOARD_COLUMNS, type BoardColumn } from "../../api/client";
import { MermaidDiagram } from "../../components/docs/MermaidDiagram";
import { RoadmapGraph } from "../../components/roadmap/RoadmapGraph";
import { StatePanel } from "../../components/state/StatePanel";
import { OnboardingChecklist } from "../../components/onboarding/OnboardingChecklist";
import { EmptyState } from "../../components/ui/EmptyState";
import { useI18n } from "../../i18n/I18nProvider";
import { useBoard } from "../../hooks/useBoard";
import { useDecisions, useRoadmap } from "../../hooks/useProjectHub";
import { useProjectState } from "../../hooks/useState";
import { isBlockerActive } from "../../utils/labels";

const QUICK_LINKS = [
  { to: "spec", labelKey: "overview.quickSpec", descKey: "overview.quickSpecDesc" },
  { to: "plan", labelKey: "overview.quickPlan", descKey: "overview.quickPlanDesc" },
  { to: "graph", labelKey: "overview.quickGraph", descKey: "overview.quickGraphDesc" },
  { to: "kanban", labelKey: "overview.quickKanban", descKey: "overview.quickKanbanDesc" },
] as const;

export function OverviewPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data: stateData } = useProjectState(slug);
  const { data: roadmapData } = useRoadmap(slug);
  const { data: board } = useBoard(slug);
  const { data: decisions } = useDecisions(slug);
  const state = stateData?.state;
  const progress = roadmapData?.progress;

  const boardCounts = BOARD_COLUMNS.map((col: BoardColumn) => ({
    col,
    count: board?.[col]?.length ?? 0,
  }));

  const showBlockerBanner = state && isBlockerActive(state.now.blocker);

  return (
    <div className="space-y-8">
      <OnboardingChecklist projectSlug={slug} variant="overview" />

      {showBlockerBanner && (
        <div
          className="rounded-[var(--radius-panel)] border border-[var(--priority-p0)]/40 bg-[var(--priority-p0)]/10 px-5 py-4"
          role="alert"
        >
          <p className="m-0 text-sm font-medium text-[var(--priority-p0)]">
            {t("overview.blockerAlert")} {state.now.blocker}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="surface-panel flex flex-col items-center justify-center p-6 text-center">
          <p className="m-0 text-xs uppercase tracking-widest text-[var(--text-muted)]">{t("overview.roadmap")}</p>
          <p className="font-display m-0 mt-2 text-5xl font-semibold text-[var(--accent)]">
            {progress?.percent ?? 0}%
          </p>
          <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">
            {t("overview.phasesDone", {
              done: progress?.done ?? 0,
              total: progress?.total ?? 0,
            })}
          </p>
          {progress && progress.active > 0 && (
            <span className="mt-3 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)]">
              {t("overview.inProgress", { count: progress.active })}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/projects/${slug}/${item.to}`}
                className="surface-card block h-full p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <p className="m-0 font-medium text-[var(--text-primary)]">{t(item.labelKey)}</p>
                <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">{t(item.descKey)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {roadmapData?.enriched_phases && roadmapData.enriched_phases.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display m-0 text-xl">{t("overview.implRoadmap")}</h2>
                <Link to={`/projects/${slug}/graph`} className="text-sm text-[var(--accent)] no-underline">
                  {t("overview.fullscreen")}
                </Link>
              </div>
              <RoadmapGraph
                slug={slug}
                phases={roadmapData.enriched_phases}
                phaseDepths={roadmapData.phase_depths}
                compact
              />
              <p className="m-0 mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {t("graph.overviewHint")}{" "}
                <Link to={`/projects/${slug}/graph`} className="text-[var(--accent)] no-underline hover:underline">
                  {t("graph.openFull")} →
                </Link>
              </p>
            </section>
          ) : (
            roadmapData?.mermaid && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display m-0 text-xl">{t("overview.implRoadmap")}</h2>
                  <Link to={`/projects/${slug}/graph`} className="text-sm text-[var(--accent)] no-underline">
                    {t("overview.fullscreen")}
                  </Link>
                </div>
                <MermaidDiagram chart={roadmapData.mermaid} />
              </section>
            )
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display m-0 text-xl">{t("overview.boardSummary")}</h2>
                <Link to={`/projects/${slug}/kanban`} className="text-sm text-[var(--accent)] no-underline">
                  {t("overview.enterKanban")}
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {boardCounts.map(({ col, count }) => (
                  <div
                    key={col}
                    className="min-w-[88px] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-center"
                  >
                    <p className="m-0 text-xs text-[var(--text-muted)]">{t(`kanban.columns.${col}`)}</p>
                    <p className="font-display m-0 mt-1 text-2xl font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display m-0 text-xl">{t("overview.decisions")}</h2>
                <Link to={`/projects/${slug}/decisions`} className="text-sm text-[var(--accent)] no-underline">
                  {t("overview.allDecisions")}
                </Link>
              </div>
              <ul className="m-0 list-none space-y-2 p-0">
                {decisions?.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/projects/${slug}/decisions#${d.id}`}
                      className="block rounded-[var(--radius-card)] border border-[var(--border-subtle)] px-3 py-2 text-sm no-underline transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      <span className="font-mono text-xs text-[var(--accent)]">{d.id}</span>
                      <span className="ml-2 text-[var(--text-primary)]">{d.title}</span>
                    </Link>
                  </li>
                ))}
                {decisions?.length === 0 && (
                  <EmptyState
                    title={t("overview.noDecisions")}
                    description={t("overview.noDecisionsDesc")}
                    icon="◇"
                  />
                )}
              </ul>
            </section>
          </div>
        </div>

        <StatePanel slug={slug} variant="panel" />
      </div>
    </div>
  );
}
