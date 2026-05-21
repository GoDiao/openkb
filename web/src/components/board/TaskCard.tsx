import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { Task } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { lockExpiringSoon, lockRemaining } from "../../utils/format";
import { PriorityBadge } from "./PriorityBadge";

type Props = {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
};

export function TaskCard({ task, onClick, isDragging }: Props) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task, column: task.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const lockLeft = task.locked_by
    ? lockRemaining(task.lock_expires, t("task.lockExpired"))
    : null;
  const expiringSoon = task.locked_by && lockExpiringSoon(task.lock_expires);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layout
      onClick={onClick}
      className={`surface-card cursor-grab p-4 transition-shadow active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:shadow-[var(--shadow-card-hover)]"
      }`}
      data-testid={`task-card-${task.id}`}
      whileHover={isDragging ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="m-0 text-sm font-medium leading-snug text-[var(--text-primary)]">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.assignee && !task.locked_by && (
        <p className="m-0 mb-2 text-xs text-[var(--text-muted)]">@{task.assignee}</p>
      )}
      {task.locked_by && (
        <div
          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
            expiringSoon
              ? "border border-[var(--priority-p0)]/40 bg-[var(--priority-p0)]/10 text-[var(--priority-p0)]"
              : "bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
          title={expiringSoon ? t("task.lockExpiringSoon") : undefined}
        >
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full animate-pulse ${
              expiringSoon ? "bg-[var(--priority-p0)]" : "bg-[var(--accent)]"
            }`}
          />
          <span className="truncate">{task.locked_by}</span>
          {lockLeft && <span className="shrink-0 opacity-75">· {lockLeft}</span>}
        </div>
      )}
    </motion.div>
  );
}
