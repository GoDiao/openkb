import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { StatePanelSkeleton } from "../ui/KanbanSkeleton";
import { usePatchState, useProjectState } from "../../hooks/useState";import { isBlockerActive } from "../../utils/labels";
import { NextItemsEditor } from "./NextItemsEditor";

type Props = {
  slug: string;
  variant?: "sidebar" | "panel";
};

export function StatePanel({ slug, variant = "sidebar" }: Props) {
  const { t } = useI18n();
  const { data, isLoading } = useProjectState(slug);
  const patchState = usePatchState(slug);
  const state = data?.state;

  const [summary, setSummary] = useState("");
  const [recentOpen, setRecentOpen] = useState(false);

  useEffect(() => {
    if (state) setSummary(state.summary);
  }, [state]);

  function saveSummary() {
    if (!state || summary === state.summary) return;
    patchState.mutate({ summary });
  }

  const shellClass =
    variant === "panel"
      ? "surface-panel flex flex-col gap-5 p-6"
      : "surface-panel flex flex-col gap-5 p-6 lg:max-w-sm xl:min-w-[320px]";

  if (isLoading) {
    return (
      <aside className={shellClass}>
        <StatePanelSkeleton />
      </aside>
    );
  }

  if (!state) return null;

  const blockerActive = isBlockerActive(state.now.blocker);

  return (
    <aside className={shellClass}>
      <div>
        <p className="m-0 text-xs font-medium uppercase tracking-widest text-[var(--accent)]">{t("state.frontier")}</p>
        <h2 className="font-display m-0 mt-1 text-2xl">{t("state.title")}</h2>
      </div>

      {blockerActive && (
        <div
          className="rounded-[var(--radius-card)] border border-[var(--priority-p0)]/40 bg-[var(--priority-p0)]/10 px-3 py-2.5 text-sm text-[var(--priority-p0)]"
          role="alert"
        >
          <span className="font-medium">{t("state.blocker")}:</span> {state.now.blocker}
        </div>
      )}

      <section>
        <h3 className="m-0 mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("state.now")}</h3>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-[var(--text-muted)]">{t("state.task")}</dt>
          <dd className="m-0 font-mono text-xs">{state.now.active_task}</dd>
          <dt className="text-[var(--text-muted)]">{t("state.owner")}</dt>
          <dd className="m-0">{state.now.owner}</dd>
          <dt className="text-[var(--text-muted)]">{t("state.branch")}</dt>
          <dd className="m-0 font-mono text-xs">{state.now.branch}</dd>
          {!blockerActive && (
            <>
              <dt className="text-[var(--text-muted)]">{t("state.blocker")}</dt>
              <dd className="m-0 text-[var(--text-muted)]">{state.now.blocker || t("common.none")}</dd>
            </>
          )}
        </dl>
      </section>

      <section>
        <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("state.summary")}</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onBlur={saveSummary}
          rows={3}
          className="focus-ring w-full resize-none rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-xs uppercase tracking-wide text-[var(--text-muted)]">{t("state.next")}</h3>
          <span className="rounded-full bg-[var(--bg-base)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            {t("state.nextCount", { count: state.next_items.length })}
          </span>
        </div>
        <NextItemsEditor
          items={state.next_items}
          onSave={(next_items) => {
            if (next_items.join("|") === state.next_items.join("|")) return;
            patchState.mutate({ next_items });
          }}
        />
      </section>

      {state.recent_done.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setRecentOpen((v) => !v)}
            className="focus-ring flex w-full items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]"
          >
            <span>{t("state.recentDone")}</span>
            <span>
              {recentOpen ? "▾" : "▸"} ({state.recent_done.length})
            </span>
          </button>
          <AnimatePresence initial={false}>
            {recentOpen && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-0 mt-2 space-y-1.5 overflow-hidden p-0"
              >
                {state.recent_done.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="text-sm text-[var(--text-muted)]"
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>
      )}

      {state.watch_out.length > 0 && (
        <section className="rounded-[var(--radius-card)] border border-[var(--priority-p0)]/20 bg-[var(--priority-p0)]/5 p-3">
          <h3 className="m-0 mb-2 text-xs uppercase text-[var(--priority-p0)]">{t("state.watchOut")}</h3>
          <ul className="m-0 space-y-1.5 p-0">
            {state.watch_out.map((w) => (
              <li
                key={w}
                className="flex items-start gap-2 text-sm text-[var(--text-primary)] before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--priority-p0)] before:content-['']"
              >
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="m-0 mt-auto text-xs text-[var(--text-muted)]">
        {state.last_updated && `${t("common.updated")} ${state.last_updated} · ${state.updated_by}`}
      </p>
    </aside>
  );
}
