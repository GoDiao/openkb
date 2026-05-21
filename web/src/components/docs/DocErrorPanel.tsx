import { useI18n } from "../../i18n/I18nProvider";

type Props = {
  kind: "spec" | "plan";
  error: Error | null;
  onRetry?: () => void;
};

export function DocErrorPanel({ kind, error, onRetry }: Props) {
  const { t } = useI18n();
  const titleKey = kind === "spec" ? "doc.loadFailedSpec" : "doc.loadFailedPlan";
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className="surface-panel p-8">
      <div className="mx-auto max-w-lg text-center">
        <p className="m-0 text-4xl opacity-30" aria-hidden>
          📄
        </p>
        <h2 className="font-display m-0 mt-4 text-xl">{t(titleKey)}</h2>
        <p className="m-0 mt-2 text-sm text-[var(--text-muted)]">
          {t("doc.loadFailedHint", { kind })}
        </p>
        <pre className="mt-4 overflow-x-auto rounded-[var(--radius-card)] bg-[var(--bg-base)] p-3 text-left text-xs text-[var(--priority-p0)]">
          {message}
        </pre>
        <p className="m-0 mt-4 text-xs text-[var(--text-muted)]">
          {t("doc.verifyHint")}{" "}
          <code className="font-mono">openkb doc verify --project &lt;slug&gt;</code>
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring mt-6 rounded-[var(--radius-card)] bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--bg-base)]"
          >
            {t("common.retry")}
          </button>
        )}
      </div>
    </div>
  );
}
