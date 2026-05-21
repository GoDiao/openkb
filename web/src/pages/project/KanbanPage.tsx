import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";
import { useBoard, useCreateTask, useMoveTask } from "../../hooks/useBoard";
import { KanbanBoard } from "../../components/board/KanbanBoard";
import { TaskSidebar } from "../../components/task/TaskSidebar";
import { KanbanSkeleton } from "../../components/ui/KanbanSkeleton";
import type { Task } from "../../api/client";

export function KanbanPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { data: board, isLoading, error } = useBoard(slug);
  const moveTask = useMoveTask(slug);
  const createTask = useCreateTask(slug);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [dragWarning, setDragWarning] = useState<string | null>(null);

  useEffect(() => {
    const task = searchParams.get("task");
    if (task) setSelectedTaskId(task);
  }, [searchParams]);

  function handleNewTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createTask.mutate({ title, priority: "P2" }, { onSuccess: () => setNewTitle("") });
  }

  return (
    <div>
      <div className="surface-panel mb-6 flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-5">
        <p className="m-0 text-sm text-[var(--text-muted)]">{t("kanban.hint")}</p>
        <form onSubmit={handleNewTask} className="flex w-full gap-2 sm:w-auto">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t("kanban.newTaskPlaceholder")}
            className="field-input focus-ring min-w-0 flex-1 sm:min-w-[220px]"
          />
          <button type="submit" disabled={createTask.isPending} className="btn-primary focus-ring shrink-0">
            {createTask.isPending ? t("common.creating") : t("kanban.addTask")}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {dragWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-4 overflow-hidden"
            role="status"
          >
            <div className="flex items-start justify-between gap-3 rounded-[var(--radius-panel)] border border-[var(--phase-active)]/35 bg-[var(--accent-soft)]/40 px-4 py-3 text-sm text-[var(--text-primary)]">
              <p className="m-0 leading-relaxed">{dragWarning}</p>
              <button
                type="button"
                onClick={() => setDragWarning(null)}
                className="btn-ghost focus-ring shrink-0 px-2"
                aria-label={t("kanban.dismissDragWarning")}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mb-4 rounded-[var(--radius-card)] border border-[var(--priority-p0)]/30 bg-[var(--priority-p0)]/10 px-4 py-3 text-sm text-[var(--priority-p0)]">
          {t("kanban.loadError")}
        </p>
      )}

      {isLoading && <KanbanSkeleton />}

      {board && (
        <KanbanBoard
          board={board}
          onMove={(taskId, column) =>
            moveTask.mutate(
              { taskId, column },
              {
                onSuccess: () => {
                  if (column === "done") setDragWarning(t("kanban.dragToDoneWarning"));
                },
              },
            )
          }
          onTaskClick={(task: Task) => setSelectedTaskId(task.id)}
        />
      )}

      <TaskSidebar slug={slug} taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}
