import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { BoardColumn, Task } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { TaskCard } from "./TaskCard";

type Props = {
  column: BoardColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  activeId: string | null;
};

export function KanbanColumn({ column, tasks, onTaskClick, activeId }: Props) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${column}`}
      className={`flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-[var(--radius-panel)] border p-3 transition-colors ${
        isOver
          ? "border-[var(--accent)] bg-[var(--accent-soft)]/40"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display m-0 text-sm font-semibold text-[var(--text-primary)]">
          {t(`kanban.columns.${column}`)}
        </h2>
        <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-1">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <TaskCard
              task={task}
              onClick={() => onTaskClick(task)}
              isDragging={activeId === task.id}
            />
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <p className="px-2 py-8 text-center text-xs text-[var(--text-muted)]">{t("kanban.emptyColumn")}</p>
        )}
      </div>
    </div>
  );
}
