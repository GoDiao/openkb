import { motion } from "framer-motion";
import type { BoardColumn } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";

const COLUMN_ICON: Record<BoardColumn, string> = {
  backlog: "◎",
  todo: "○",
  doing: "◉",
  review: "◈",
  done: "✓",
};

type Props = {
  column: BoardColumn;
};

export function KanbanColumnEmpty({ column }: Props) {
  const { t } = useI18n();

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center px-3 py-8 text-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-xl text-[var(--text-muted)]"
        aria-hidden
      >
        {COLUMN_ICON[column]}
      </div>
      <p className="m-0 text-xs font-medium text-[var(--text-primary)]">
        {t(`kanban.emptyStates.${column}.title`)}
      </p>
      <p className="m-0 mt-1 max-w-[180px] text-[10px] leading-relaxed text-[var(--text-muted)]">
        {t(`kanban.emptyStates.${column}.hint`)}
      </p>
    </motion.div>
  );
}
