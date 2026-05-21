import { useDroppable } from "@dnd-kit/core";

import { motion, AnimatePresence } from "framer-motion";

import type { BoardColumn, Task } from "../../api/client";

import { useI18n } from "../../i18n/I18nProvider";

import { TaskCard } from "./TaskCard";

import { KanbanColumnEmpty } from "./KanbanColumnEmpty";



const COLUMN_ACCENT: Record<BoardColumn, string> = {

  backlog: "var(--text-muted)",

  todo: "var(--phase-pending)",

  doing: "var(--phase-active)",

  review: "var(--accent)",

  done: "var(--phase-done)",

};



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

      className={`flex min-h-[440px] w-[292px] shrink-0 flex-col rounded-[var(--radius-panel)] border p-3 transition-all duration-300 ${

        isOver

          ? "scale-[1.01] border-[var(--accent)] bg-[var(--accent-soft)]/50 shadow-[var(--shadow-card-hover)]"

          : "border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_72%,transparent)] backdrop-blur-sm"

      }`}

    >

      <div className="mb-3 flex items-center justify-between px-1">

        <div className="flex items-center gap-2">

          <span

            className="h-2 w-2 rounded-full"

            style={{ backgroundColor: COLUMN_ACCENT[column] }}

            aria-hidden

          />

          <h2 className="font-display m-0 text-sm font-semibold text-[var(--text-primary)]">

            {t(`kanban.columns.${column}`)}

          </h2>

        </div>

        <span className="font-mono rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs tabular-nums text-[var(--text-muted)]">

          {tasks.length}

        </span>

      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-1">

        <AnimatePresence initial={false}>

          {tasks.map((task, i) => (

            <motion.div

              key={task.id}

              layout

              initial={{ opacity: 0, y: 8 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, scale: 0.96 }}

              transition={{ delay: i * 0.02, type: "spring", stiffness: 420, damping: 34 }}

            >

              <TaskCard

                task={task}

                onClick={() => onTaskClick(task)}

                isDragging={activeId === task.id}

              />

            </motion.div>

          ))}

        </AnimatePresence>

        {tasks.length === 0 && <KanbanColumnEmpty column={column} />}

      </div>

    </div>

  );

}


