import { motion } from "framer-motion";
import type { DocSection } from "./MarkdownDoc";

type Props = {
  sections: DocSection[];
  activeId: string | null;
  readProgress: number;
  onSelect: (id: string) => void;
  phaseStatus?: Map<string, string>;
  layoutId?: string;
};

export function DocTocNav({
  sections,
  activeId,
  readProgress,
  onSelect,
  phaseStatus,
  layoutId = "doc-toc-indicator",
}: Props) {
  const activeIndex = sections.findIndex((s) => s.id === activeId);

  return (
    <nav aria-label="Table of contents">
      {sections.length > 1 && (
        <div className="mb-4 lg:hidden">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] tabular-nums text-[var(--accent)]">{readProgress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-base)]">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              animate={{ width: `${readProgress}%` }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}
      <ul className="relative m-0 list-none space-y-0.5 p-0">
        {sections.map((s, index) => {
          const active = activeId === s.id;
          const passed = activeIndex >= 0 && index < activeIndex;
          const statusKey = s.title.match(/Phase \d+/i)?.[0] ?? s.title.split(":")[0];
          const status = phaseStatus?.get(statusKey);

          return (
            <li key={`${s.line}-${s.id}`} className="relative">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={`focus-ring relative w-full rounded-[var(--radius-sm)] py-2 text-left text-sm transition lg:py-1.5 lg:text-xs ${
                  s.level === 2 ? "pl-3 pr-2 font-medium" : "pl-6 pr-2 text-[var(--text-muted)]"
                } ${
                  active
                    ? "text-[var(--accent)]"
                    : passed
                      ? "text-[var(--text-muted)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-base)] hover:text-[var(--accent)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full bg-[var(--accent)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="flex items-start gap-1.5">
                  {status === "done" && (
                    <span className="shrink-0 text-[var(--phase-done)]" aria-hidden>
                      ✓
                    </span>
                  )}
                  {status === "active" && (
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--phase-active)]"
                      aria-hidden
                    />
                  )}
                  {!status && passed && (
                    <span className="shrink-0 text-[var(--text-muted)] opacity-50" aria-hidden>
                      ·
                    </span>
                  )}
                  <span className="line-clamp-2">{s.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
