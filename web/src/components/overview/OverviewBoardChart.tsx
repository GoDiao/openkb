import { motion } from "framer-motion";
import type { BoardColumn } from "../../api/client";
import { CountUp } from "../ui/CountUp";
import { useI18n } from "../../i18n/I18nProvider";

const COLUMN_CHART_VAR: Record<BoardColumn, string> = {
  backlog: "var(--chart-bar-backlog)",
  todo: "var(--chart-bar-todo)",
  doing: "var(--chart-bar-doing)",
  review: "var(--chart-bar-review)",
  done: "var(--chart-bar-done)",
};

type Item = { col: BoardColumn; count: number };

type Props = {
  items: Item[];
};

export function OverviewBoardChart({ items }: Props) {
  const { t } = useI18n();
  const max = Math.max(...items.map((i) => i.count), 1);
  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="space-y-3" data-testid="overview-board-chart">
      {items.map(({ col, count }, i) => {
        const widthPct = total === 0 ? 0 : (count / max) * 100;
        const barColor = COLUMN_CHART_VAR[col];
        return (
          <div
            key={col}
            className="group/bar grid grid-cols-[72px_1fr_2rem] items-center gap-3"
            data-testid={`overview-board-bar-${col}`}
          >
            <span className="truncate text-xs text-[var(--text-muted)]">{t(`kanban.columns.${col}`)}</span>
            <div className="relative h-2 overflow-hidden rounded-full bg-[var(--chart-bar-track)]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: 0, opacity: 0.6 }}
                animate={{ width: `${widthPct}%`, opacity: 1 }}
                transition={{
                  delay: 0.08 + i * 0.07,
                  duration: 0.65,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full opacity-30"
                style={{
                  backgroundColor: barColor,
                  boxShadow: `0 0 12px ${barColor}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{
                  delay: 0.08 + i * 0.07,
                  duration: 0.65,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
            <span className="font-display text-right text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              <CountUp value={count} duration={0.5} />
            </span>
          </div>
        );
      })}
      {total === 0 && (
        <p className="m-0 py-2 text-center text-xs text-[var(--text-muted)]">{t("overview.boardEmpty")}</p>
      )}
    </div>
  );
}
