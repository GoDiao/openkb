import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../i18n/I18nProvider";
import { useCreateProject, useProjects } from "../hooks/useProjects";
import { ProjectCard } from "../components/projects/ProjectCard";
import { NewProjectModal } from "../components/projects/NewProjectModal";
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist";
import { HubHeroDemo } from "../components/onboarding/HubHeroDemo";
import { Skeleton } from "../components/ui/Skeleton";

export function ProjectListPage() {
  const { t } = useI18n();
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const [modalOpen, setModalOpen] = useState(false);

  const isEmpty = projects && projects.length === 0 && !isLoading;

  return (
    <div>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <motion.p
            className="m-0 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            OpenKB Hub
          </motion.p>
          <motion.h1
            className="font-display text-balance m-0 mt-2 text-4xl font-semibold tracking-tight md:text-5xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
          >
            {t("projects.title")}
          </motion.h1>
          <motion.p
            className="text-balance mt-3 max-w-lg text-[var(--text-muted)] leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {t("projects.subtitle")}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
            <Link
              to="/help"
              className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--accent)] no-underline transition hover:gap-2"
            >
              {t("help.learnMore")}
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary focus-ring">
            {t("projects.newProject")}
          </button>
        </motion.div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-[var(--radius-panel)]" />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-[var(--radius-panel)] border border-[var(--priority-p0)]/30 bg-[var(--priority-p0)]/10 px-5 py-4 text-sm text-[var(--priority-p0)]">
          {t("projects.apiError")}{" "}
          <code className="font-mono rounded bg-[var(--bg-base)] px-1.5 py-0.5 text-xs">uv run openkb serve</code>
        </p>
      )}

      {isEmpty && (
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div className="space-y-6">
            <OnboardingChecklist variant="list" />
            <div className="surface-panel p-8 text-center md:text-left">
              <p className="font-display m-0 text-xl text-[var(--text-primary)]">{t("projects.emptyTitle")}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{t("projects.emptyDesc")}</p>
              <button type="button" onClick={() => setModalOpen(true)} className="btn-primary focus-ring mt-6">
                {t("projects.newProject")}
              </button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <HubHeroDemo />
          </motion.div>
        </div>
      )}

      {!isEmpty && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects?.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      )}

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
