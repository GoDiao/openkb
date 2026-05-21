import type { Priority } from "../../api/client";

const PRIORITY_CLASS: Record<Priority, string> = {
  P0: "bg-[var(--priority-p0)]/15 text-[var(--priority-p0)]",
  P1: "bg-[var(--accent-soft)] text-[var(--accent)]",
  P2: "bg-[var(--border-subtle)] text-[var(--text-muted)]",
  P3: "bg-transparent text-[var(--text-muted)] opacity-70",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CLASS[priority]}`}>
      {priority}
    </span>
  );
}
