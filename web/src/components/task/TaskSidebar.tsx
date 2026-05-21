import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useCheckoutTask, useReleaseTask, useTask, useUpdateTask } from "../../hooks/useBoard";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { PriorityBadge } from "../board/PriorityBadge";
import { TaskSidebarSkeleton } from "../ui/KanbanSkeleton";
import { lockExpiringSoon, lockRemaining } from "../../utils/format";

type Props = {
  slug: string;
  taskId: string | null;
  onClose: () => void;
};

export function TaskSidebar({ slug, taskId, onClose }: Props) {
  const { t } = useI18n();
  const { data, isLoading } = useTask(slug, taskId);
  const updateTask = useUpdateTask(slug);
  const checkout = useCheckoutTask(slug);
  const release = useReleaseTask(slug);
  const task = data?.task;

  const [title, setTitle] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task]);

  useEscapeKey(onClose, Boolean(taskId));

  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    if (!task || value === task.title) return;
    updateTask.mutate(
      { taskId: task.id, patch: { title: value } },
      {
        onSuccess: () => {
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 1200);
        },
      },
    );
  }, 500);

  function handleTitleChange(value: string) {
    setTitle(value);
    debouncedSaveTitle(value);
  }

  function handleTitleBlur() {
    if (!task || title === task.title) return;
    updateTask.mutate({ taskId: task.id, patch: { title } });
  }

  const lockLeft = task?.locked_by
    ? lockRemaining(task.lock_expires, t("task.lockExpired"))
    : null;
  const expiringSoon = task?.locked_by && lockExpiringSoon(task.lock_expires);

  return (
    <AnimatePresence>
      {taskId && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[var(--backdrop-blur)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label={t("task.closeSidebar")}
            onClick={onClose}
          />
          <motion.aside
            className="surface-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border-subtle)] shadow-[var(--shadow-card-hover)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {isLoading || !task ? (
              <TaskSidebarSkeleton />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-6">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="m-0 font-mono text-xs text-[var(--text-muted)]">#{task.id}</p>
                      <PriorityBadge priority={task.priority} />
                      <span className="rounded-full bg-[var(--bg-base)] px-2 py-0.5 text-[10px] uppercase text-[var(--text-muted)]">
                        {t(`kanban.columns.${task.status}`)}
                      </span>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={handleTitleBlur}
                      className="font-display focus-ring w-full border-0 bg-transparent p-0 text-xl font-semibold text-[var(--text-primary)]"
                    />
                    <AnimatePresence>
                      {savedFlash && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="m-0 mt-1 text-xs text-[var(--phase-done)]"
                        >
                          {t("task.saved")}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost focus-ring rounded-full px-2 py-1"
                    aria-label={t("common.close")}
                  >
                    ✕
                  </button>
                </div>

                {task.locked_by && (
                  <div
                    className={`mx-6 mt-4 rounded-[var(--radius-card)] px-3 py-2.5 text-sm ${
                      expiringSoon
                        ? "border border-[var(--priority-p0)]/40 bg-[var(--priority-p0)]/10 text-[var(--priority-p0)]"
                        : "border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]"
                    }`}
                  >
                    <p className="m-0 text-xs uppercase tracking-wide opacity-80">
                      {expiringSoon ? t("task.lockExpiringSoon") : t("task.lockedBy")}
                    </p>
                    <p className="m-0 mt-1 font-medium">{task.locked_by}</p>
                    {lockLeft && (
                      <p className="m-0 mt-0.5 text-xs opacity-80">
                        {t("task.lockExpires")}: {lockLeft}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                  <label className="mb-5 block">
                    <span className="field-label">{t("task.goal")}</span>
                    <textarea
                      defaultValue={task.goal}
                      onBlur={(e) => {
                        if (e.target.value !== task.goal) {
                          updateTask.mutate({ taskId: task.id, patch: { goal: e.target.value } });
                        }
                      }}
                      rows={3}
                      className="field-input focus-ring resize-none"
                    />
                  </label>

                  <div className="mb-5">
                    <span className="field-label">{t("task.acceptance")}</span>
                    <ul className="m-0 list-none space-y-2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3">
                      {task.acceptance.map((line, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 text-xs leading-relaxed text-[var(--text-primary)] before:mt-1.5 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[var(--accent)] before:content-['']"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {task.notes && (
                    <div>
                      <span className="field-label">{t("task.notes")}</span>
                      <pre className="m-0 whitespace-pre-wrap rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">
                        {task.notes}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-[var(--border-subtle)] p-4">
                  {!task.locked_by ? (
                    <button
                      type="button"
                      onClick={() => checkout.mutate(task.id)}
                      disabled={checkout.isPending}
                      className="btn-primary focus-ring flex-1"
                    >
                      {t("task.checkout")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => release.mutate(task.id)}
                      disabled={release.isPending}
                      className="btn-secondary focus-ring flex-1"
                    >
                      {t("task.release")}
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
