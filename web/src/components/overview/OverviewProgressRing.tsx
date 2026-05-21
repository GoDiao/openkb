import { motion } from "framer-motion";
import { CountUp } from "../ui/CountUp";

type Props = {
  percent: number;
  done: number;
  total: number;
  active: number;
  label: string;
  phasesDoneLabel: string;
  inProgressLabel?: string;
};

const SIZE = 168;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function OverviewProgressRing({
  percent,
  done,
  total,
  active,
  label,
  phasesDoneLabel,
  inProgressLabel,
}: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = C * (1 - clamped / 100);

  return (
    <div
      className="flex flex-col items-center text-center"
      data-testid="overview-progress-ring"
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--chart-ring-track)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--chart-ring)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            style={{
              filter: "drop-shadow(0 0 8px var(--chart-ring-glow))",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display m-0 text-4xl font-semibold tabular-nums text-[var(--chart-ring)]">
            <CountUp value={clamped} />
            <span className="text-2xl">%</span>
          </p>
        </div>
      </div>
      <p className="m-0 mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">{phasesDoneLabel}</p>
      {active > 0 && inProgressLabel && (
        <motion.span
          className="mt-3 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent)]"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 420, damping: 32 }}
        >
          {inProgressLabel}
        </motion.span>
      )}
      {total > 0 && (
        <OverviewPhaseStrip done={done} active={active} total={total} />
      )}
    </div>
  );
}

function OverviewPhaseStrip({ done, active, total }: { done: number; active: number; total: number }) {
  const pending = Math.max(total - done - active, 0);
  const segments = [
    { key: "done", value: done, color: "var(--phase-done)" },
    { key: "active", value: active, color: "var(--phase-active)" },
    { key: "pending", value: pending, color: "var(--chart-phase-pending)" },
  ].filter((s) => s.value > 0);

  return (
    <div className="mt-4 w-full max-w-[140px]" data-testid="overview-phase-strip">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--chart-bar-track)]">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            className="h-full"
            style={{ backgroundColor: seg.color }}
            initial={{ flex: 0 }}
            animate={{ flex: seg.value }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  );
}
