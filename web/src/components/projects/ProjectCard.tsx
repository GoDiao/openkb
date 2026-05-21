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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 380, damping: 32 }}
    >
      <Link
        to={`/projects/${project.slug}`}
        className="group surface-card block p-6 no-underline transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display m-0 text-xl text-[var(--text-primary)]">{project.name}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {health.hasBlocker && (
              <span
                className="h-2 w-2 rounded-full bg-[var(--priority-p0)]"
                title={`${t("projects.blocker")}: ${health.blocker}`}
                aria-label={t("projects.blocker")}
              />
            )}
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
              {statusLabel}
            </span>
          </div>
        </div>
        <p className="m-0 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {project.description || t("projects.noDescription")}
        </p>
        {!health.isLoading && (health.activePhaseTitle || health.progressPercent != null) && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {health.progressPercent != null && (
              <span className="mr-3 font-medium text-[var(--accent)]">{health.progressPercent}%</span>
            )}
            {health.activePhaseTitle && (
              <span className="line-clamp-1">
                {t("projects.current")}: {health.activePhaseTitle}
              </span>
            )}
          </p>
        )}
        <p className="mt-4 truncate font-mono text-xs text-[var(--text-muted)] opacity-80">{project.repo_path}</p>
        <div className="mt-4 h-0.5 w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
      </Link>
    </motion.div>
  );
}
