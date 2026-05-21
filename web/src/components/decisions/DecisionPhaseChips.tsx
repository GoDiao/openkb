import { Link, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";
import type { DecisionMeta } from "../../hooks/useProjectHub";

type Props = {
  phases: string[];
};

export function DecisionPhaseChips({ phases }: Props) {
  const { t } = useI18n();
  const { slug = "" } = useParams();

  if (!phases.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{t("decisions.phases")}</span>
      {phases.map((phaseId) => (
        <Link
          key={phaseId}
          to={`/projects/${slug}/graph#phase-${phaseId}`}
          className="rounded-md border border-[var(--border-subtle)] px-2 py-0.5 font-mono text-[10px] text-[var(--accent)] no-underline transition hover:bg-[var(--accent-soft)]"
        >
          {phaseId}
        </Link>
      ))}
    </div>
  );
}

export function decisionPhases(item: DecisionMeta): string[] {
  return item.phases ?? [];
}
