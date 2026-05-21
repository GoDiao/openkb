import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { MarkdownDoc, parseDocSections } from "../../components/docs/MarkdownDoc";
import { DecisionPhaseChips, decisionPhases } from "../../components/decisions/DecisionPhaseChips";
import { EmptyState } from "../../components/ui/EmptyState";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useDecision, useDecisions } from "../../hooks/useProjectHub";
import { useDocReadProgress } from "../../hooks/useDocReadProgress";

export function DecisionsPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data: list, isLoading } = useDecisions(slug);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: doc, isLoading: docLoading } = useDecision(slug, selected);

  const sections = useMemo(
    () => (doc?.content ? parseDocSections(doc.content) : []),
    [doc?.content],
  );
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const readProgress = useDocReadProgress(sectionIds);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) setSelected(hash);
    else if (list?.length) setSelected(list[0].id);
  }, [list]);

  if (isLoading) {
    return (
      <div className="surface-panel p-8 md:p-10">
        <DocSkeleton />
      </div>
    );
  }

  return (
    <>
      {sectionIds.length > 1 && readProgress > 0 && (
        <div
          className="doc-read-progress lg:block"
          style={{ width: `${readProgress}%` }}
          aria-hidden
        />
      )}
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0">
          <div className="surface-panel sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="m-0 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {t("decisions.list")}
              </p>
              {sectionIds.length > 1 && readProgress > 0 && (
                <span className="font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
                  {readProgress}%
                </span>
              )}
            </div>
            {list && list.length > 0 ? (
              <ul className="m-0 list-none space-y-1 p-0">
                {list.map((d, i) => {
                  const active = selected === d.id;
                  return (
                    <motion.li
                      key={d.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(d.id);
                          window.location.hash = d.id;
                        }}
                        className={`focus-ring relative w-full rounded-[var(--radius-card)] px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="decision-list-indicator"
                            className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[var(--accent)]"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="block font-mono text-xs">{d.id}</span>
                        <span className="mt-0.5 block truncate font-medium">{d.title}</span>
                        {decisionPhases(d).length > 0 && (
                          <span className="mt-1 block truncate font-mono text-[10px] text-[var(--text-muted)]">
                            {decisionPhases(d).join(", ")}
                          </span>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title={t("decisions.empty")} description={t("decisions.emptyDesc")} icon="◇" />
            )}
          </div>
        </aside>
        <div className="surface-panel min-w-0 flex-1 overflow-hidden">
          <div className="px-6 py-8 md:px-10 md:py-10">
            {docLoading && <DocSkeleton />}
            {!docLoading && doc ? (
              <motion.div
                key={selected ?? "doc"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {doc.phases && doc.phases.length > 0 && <DecisionPhaseChips phases={doc.phases} />}
                <MarkdownDoc content={doc.content} headingIds />
              </motion.div>
            ) : !docLoading && !doc ? (
              <EmptyState title={t("decisions.pick")} description={t("decisions.pickDesc")} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
