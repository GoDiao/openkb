import { useEffect, useState } from "react";

import { useParams, useSearchParams } from "react-router-dom";

import { useI18n } from "../../i18n/I18nProvider";

import { useBoard, useCreateTask, useMoveTask } from "../../hooks/useBoard";

import { KanbanBoard } from "../../components/board/KanbanBoard";

import { TaskSidebar } from "../../components/task/TaskSidebar";

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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <p className="m-0 text-sm text-[var(--text-muted)]">{t("kanban.hint")}</p>

        <form onSubmit={handleNewTask} className="flex gap-2">

          <input

            value={newTitle}

            onChange={(e) => setNewTitle(e.target.value)}

            placeholder={t("kanban.newTaskPlaceholder")}

            className="focus-ring min-w-[200px] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"

          />

          <button

            type="submit"

            disabled={createTask.isPending}

            className="focus-ring rounded-[var(--radius-card)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] disabled:opacity-50"

          >

            {t("kanban.addTask")}

          </button>

        </form>

      </div>



      {dragWarning && (
        <div
          className="mb-4 flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--priority-p2)]/40 bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)]"
          role="status"
        >
          <p className="m-0 leading-relaxed">{dragWarning}</p>
          <button
            type="button"
            onClick={() => setDragWarning(null)}
            className="focus-ring shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label={t("kanban.dismissDragWarning")}
          >
            ×
          </button>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-[var(--priority-p0)]">{t("kanban.loadError")}</p>}

      {isLoading && <p className="text-[var(--text-muted)]">{t("kanban.loading")}</p>}

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

