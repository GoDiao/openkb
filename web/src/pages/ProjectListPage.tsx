import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../i18n/I18nProvider";
import { useCreateProject, useProjects } from "../hooks/useProjects";
import { ProjectCard } from "../components/projects/ProjectCard";
import { NewProjectModal } from "../components/projects/NewProjectModal";
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist";

export function ProjectListPage() {
  const { t } = useI18n();
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.h1
            className="font-display m-0 text-4xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t("projects.title")}
          </motion.h1>
          <p className="mt-2 max-w-lg text-[var(--text-muted)] leading-relaxed">{t("projects.subtitle")}</p>
          <Link to="/help" className="mt-2 inline-block text-sm text-[var(--accent)] no-underline hover:underline">
            {t("help.learnMore")}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="focus-ring rounded-[var(--radius-card)] border border-[var(--accent)] bg-[var(--accent-soft)] px-5 py-2.5 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-[var(--bg-base)]"
        >
          {t("projects.newProject")}
        </button>
      </div>

      {isLoading && <p className="text-[var(--text-muted)]">{t("common.loading")}</p>}
      {error && (
        <p className="rounded-[var(--radius-card)] border border-[var(--priority-p0)]/30 bg-[var(--priority-p0)]/10 px-4 py-3 text-sm text-[var(--priority-p0)]">
          {t("projects.apiError")} <code className="font-mono">uv run openkb serve</code>
        </p>
      )}

      {projects && projects.length === 0 && !isLoading && (
        <OnboardingChecklist variant="list" />
      )}

      {projects && projects.length === 0 && !isLoading && (
        <div className="surface-panel mx-auto max-w-md p-10 text-center">
          <p className="font-display m-0 text-xl text-[var(--text-primary)]">{t("projects.emptyTitle")}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{t("projects.emptyDesc")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects?.map((p, i) => (
          <ProjectCard key={p.slug} project={p} index={i} />
        ))}
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isPending={createProject.isPending}
        onSubmit={(data) => {
          createProject.mutate(data, {
            onSuccess: () => {
              setModalOpen(false);
            },
          });
        }}
      />
    </div>
  );
}
