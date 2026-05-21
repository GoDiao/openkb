import { Link, Outlet, useParams } from "react-router-dom";
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
    <div>
      <div className="mb-2">
        <Link to="/" className="text-sm text-[var(--text-muted)] no-underline hover:text-[var(--accent)]">
          {t("project.back")}
        </Link>
        <h1 className="font-display m-0 mt-2 text-3xl font-semibold">{project?.name ?? slug}</h1>
        {project?.description && (
          <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">{project.description}</p>
        )}
      </div>
      <ProjectNav />
      <ProjectWatchProvider slug={slug}>
        <Outlet />
      </ProjectWatchProvider>
    </div>
  );
}
