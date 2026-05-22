import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";

const DEMO_COLUMNS = [
  { id: "todo", labelKey: "projects.hero.todo", cardKeys: ["projects.hero.agentSync", "projects.hero.writeSpec"] },
  { id: "doing", labelKey: "projects.hero.doing", cardKeys: ["projects.hero.buildUi"] },
  { id: "done", labelKey: "projects.hero.done", cardKeys: ["projects.hero.setupRepo"] },
];

const DEMO_PHASES = [
  { id: "p1", labelKey: "projects.hero.setup", status: "done" as const, x: 12, y: 48 },
  { id: "p2", labelKey: "projects.hero.core", status: "active" as const, x: 108, y: 28 },
  { id: "p3", labelKey: "projects.hero.polish", status: "pending" as const, x: 204, y: 48 },
];

const STATUS_COLOR = {
  done: "var(--phase-done)",
  active: "var(--phase-active)",
  pending: "var(--phase-pending)",
};

export function HubHeroDemo() {
  const { t } = useI18n();

  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      aria-hidden
    >
      <div className="surface-panel overflow-hidden p-1 shadow-[var(--shadow-card-hover)]">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--priority-p0)]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--phase-active)]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--phase-done)]/70" />
          <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">{t("projects.hero.preview")}</span>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="m-0 mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              {t("projects.hero.kanban")}
            </p>
            <div className="flex gap-2">
              {DEMO_COLUMNS.map((col, colIdx) => (
                <div
                  key={col.id}
                  className="min-h-[140px] flex-1 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 p-2"
                >
                  <p className="m-0 mb-2 text-[9px] font-medium text-[var(--text-muted)]">{t(col.labelKey)}</p>
                  <div className="space-y-1.5">
                    {col.cardKeys.map((cardKey, cardIdx) => (
                      <motion.div
                        key={cardKey}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[9px] text-[var(--text-primary)]"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: colIdx * 0.15 + cardIdx * 0.1,
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      >
                        {t(cardKey)}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              className="mt-2 h-8 rounded-[var(--radius-card)] border border-dashed border-[var(--accent)]/40 bg-[var(--accent-soft)]/30"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div>
            <p className="m-0 mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              {t("projects.hero.roadmap")}
            </p>
            <div className="relative h-[168px] rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)]/70">
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                <motion.path
                  d="M 52 68 L 108 48 L 164 68"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>

              {DEMO_PHASES.map((phase, i) => (
                <motion.div
                  key={phase.id}
                  className="absolute w-[72px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm"
                  style={{ left: phase.x, top: phase.y }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.18, type: "spring", stiffness: 420, damping: 30 }}
                >
                  <motion.div
                    className="h-0.5 w-full"
                    style={{ background: STATUS_COLOR[phase.status] }}
                    animate={
                      phase.status === "active"
                        ? { opacity: [0.5, 1, 0.5] }
                        : { opacity: 1 }
                    }
                    transition={
                      phase.status === "active"
                        ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                        : undefined
                    }
                  />
                  <div className="px-2 py-1.5">
                    <p className="m-0 font-mono text-[8px] text-[var(--accent)]">{phase.id}</p>
                    <p className="m-0 mt-0.5 text-[9px] font-medium text-[var(--text-primary)]">{t(phase.labelKey)}</p>
                  </div>
                  {phase.status === "done" && (
                    <motion.span
                      className="absolute right-1 top-1 text-[8px] text-[var(--phase-done)]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              ))}

              <motion.div
                className="absolute bottom-2 left-2 right-2 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  initial={{ width: "0%" }}
                  animate={{ width: "42%" }}
                  transition={{ delay: 1, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--accent-soft)] blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
