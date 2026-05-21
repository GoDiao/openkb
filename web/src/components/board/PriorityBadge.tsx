import type { Priority } from "../../api/client";

const PRIORITY_CLASS: Record<Priority, string> = {
  P0: "border-[var(--priority-p0)]/40 bg-[var(--priority-p0)]/12 text-[var(--priority-p0)] shadow-[0_0_12px_color-mix(in_srgb,var(--priority-p0)_18%,transparent)]",
  P1: "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]",
  P2: "border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-muted)]",
  P3: "border-transparent bg-transparent text-[var(--text-muted)] opacity-70",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CLASS[priority]}`}
    >
      {priority}
    </span>
  );
}
