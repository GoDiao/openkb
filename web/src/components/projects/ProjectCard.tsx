import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Project } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { useProjectHealth } from "../../hooks/useProjectHealth";

type Props = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: Props) {
  const { t } = useI18n();
  const health = useProjectHealth(project.slug);

  const statusLabel =
    project.status === "active" ? t("common.active") : t("common.archived");
  const progress = health.progressPercent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 380, damping: 32 }}
    >
      <Link
        to={`/projects/${project.slug}`}
        className="group surface-card block overflow-hidden p-6 no-underline hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display m-0 text-xl tracking-tight text-[var(--text-primary)] transition group-hover:text-[var(--accent)]">
            {project.name}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {health.hasBlocker && (
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-[var(--priority-p0)] shadow-[0_0_8px_var(--priority-p0)]"
                title={`${t("projects.blocker")}: ${health.blocker}`}
                aria-label={t("projects.blocker")}
              />
            )}
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
              {statusLabel}
            </span>
          </div>
        </div>
        <p className="m-0 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {project.description || t("projects.noDescription")}
        </p>

        {!health.isLoading && (health.activePhaseTitle || health.progressPercent != null) && (
          <div className="mt-4 space-y-2">
            {health.progressPercent != null && (
              <div className="flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-base)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    transition={{ delay: index * 0.05 + 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="font-mono text-xs font-medium tabular-nums text-[var(--accent)]">
                  {progress}%
                </span>
              </div>
            )}
            {health.activePhaseTitle && (
              <p className="m-0 line-clamp-1 text-xs text-[var(--text-muted)]">
                {t("projects.current")}:{" "}
                <span className="text-[var(--text-primary)]">{health.activePhaseTitle}</span>
              </p>
            )}
          </div>
        )}

        <p className="mt-4 truncate font-mono text-[11px] text-[var(--text-muted)] opacity-70">
          {project.repo_path}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
          <span>{t("tabs.overview")}</span>
          <span aria-hidden>→</span>
        </div>
      </Link>
    </motion.div>
  );
}
