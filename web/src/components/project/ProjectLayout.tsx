import { Link, Outlet, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useProjects } from "../../hooks/useProjects";
import { ProjectWatchProvider } from "../../hooks/useProjectWatch";
import { ProjectNav } from "./ProjectNav";

export function ProjectLayout() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.slug === slug);

  return (
    <ProjectWatchProvider slug={slug}>
      <div>
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] no-underline transition hover:text-[var(--accent)]"
          >
            <span aria-hidden>←</span>
            {t("project.back")}
          </Link>
          <h1 className="font-display text-balance m-0 mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {project?.name ?? slug}
          </h1>
          {project?.description && (
            <p className="text-balance mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
              {project.description}
            </p>
          )}
        </motion.div>
        <ProjectNav />
        <Outlet />
      </div>
    </ProjectWatchProvider>
  );
}
