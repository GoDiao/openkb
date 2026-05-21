import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import type { DocSection } from "./MarkdownDoc";
import { DocTocNav } from "./DocTocNav";

type Props = {
  title: string;
  sections: DocSection[];
  activeId: string | null;
  readProgress: number;
  onSelect: (id: string) => void;
  phaseStatus?: Map<string, string>;
};

export function DocTableOfContents({ title, sections, activeId, readProgress, onSelect, phaseStatus }: Props) {
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeIndex = sections.findIndex((s) => s.id === activeId);

  if (sections.length === 0) return null;

  function select(id: string) {
    onSelect(id);
    setDrawerOpen(false);
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="surface-panel sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="m-0 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{title}</p>
              <span className="font-mono text-[10px] tabular-nums text-[var(--accent)]">{readProgress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-base)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                animate={{ width: `${readProgress}%` }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {activeIndex >= 0 && (
              <p className="m-0 mt-2 text-[10px] text-[var(--text-muted)]">
                {t("doc.sectionProgress", { current: activeIndex + 1, total: sections.length })}
              </p>
            )}
          </div>
          <DocTocNav
            sections={sections}
            activeId={activeId}
            readProgress={readProgress}
            onSelect={select}
            phaseStatus={phaseStatus}
            layoutId="doc-toc-indicator-desktop"
          />
        </div>
      </aside>

      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="btn-primary focus-ring shadow-[var(--shadow-card-hover)]"
        >
          {title}
          {readProgress > 0 && (
            <span className="font-mono text-[10px] opacity-80">{readProgress}%</span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[var(--backdrop-blur)] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label={t("common.close")}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="surface-panel fixed inset-x-0 bottom-0 z-50 max-h-[72vh] overflow-hidden rounded-t-[var(--radius-panel)] border border-[var(--border-subtle)] lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              role="dialog"
              aria-label={title}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
                <p className="m-0 text-sm font-medium text-[var(--text-primary)]">{title}</p>
                <button type="button" onClick={() => setDrawerOpen(false)} className="btn-ghost focus-ring px-2">
                  {t("common.close")}
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 pb-8">
                <DocTocNav
                  sections={sections}
                  activeId={activeId}
                  readProgress={readProgress}
                  onSelect={select}
                  phaseStatus={phaseStatus}
                  layoutId="doc-toc-indicator-mobile"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
