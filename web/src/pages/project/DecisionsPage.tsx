import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MarkdownDoc } from "../../components/docs/MarkdownDoc";
import { DecisionPhaseChips, decisionPhases } from "../../components/decisions/DecisionPhaseChips";
import { EmptyState } from "../../components/ui/EmptyState";
import { DocSkeleton } from "../../components/ui/Skeleton";
import { useI18n } from "../../i18n/I18nProvider";
import { useDecision, useDecisions } from "../../hooks/useProjectHub";

export function DecisionsPage() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const { data: list, isLoading } = useDecisions(slug);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: doc, isLoading: docLoading } = useDecision(slug, selected);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) setSelected(hash);
    else if (list?.length) setSelected(list[0].id);
  }, [list]);

  if (isLoading) {
    return (
      <div className="surface-panel p-8">
        <DocSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-72 lg:shrink-0">
        <div className="surface-panel p-4">
          <p className="m-0 mb-3 text-xs uppercase text-[var(--text-muted)]">{t("decisions.list")}</p>
          {list && list.length > 0 ? (
            <ul className="m-0 list-none space-y-1 p-0">
              {list.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(d.id);
                      window.location.hash = d.id;
                    }}
                    className={`focus-ring w-full rounded-md px-3 py-2 text-left text-sm transition ${
                      selected === d.id
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "hover:bg-[var(--bg-base)]"
                    }`}
                  >
                    <span className="block font-mono text-xs">{d.id}</span>
                    <span className="block truncate">{d.title}</span>
                    {decisionPhases(d).length > 0 && (
                      <span className="mt-1 block truncate font-mono text-[10px] text-[var(--text-muted)]">
                        {decisionPhases(d).join(", ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t("decisions.empty")} description={t("decisions.emptyDesc")} icon="◇" />
          )}
        </div>
      </aside>
      <div className="surface-panel min-w-0 flex-1 p-8">
        {docLoading && <DocSkeleton />}
        {!docLoading && doc ? (
          <>
            {doc.phases && doc.phases.length > 0 && <DecisionPhaseChips phases={doc.phases} />}
            <MarkdownDoc content={doc.content} headingIds />
          </>
        ) : !docLoading && !doc ? (
          <EmptyState title={t("decisions.pick")} description={t("decisions.pickDesc")} />
        ) : null}
      </div>
    </div>
  );
}
