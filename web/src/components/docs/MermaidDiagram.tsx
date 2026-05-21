import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/useTheme";
import { MermaidSkeleton } from "../ui/Skeleton";

type Props = {
  chart: string;
  className?: string;
};

export function MermaidDiagram({ chart, className = "" }: Props) {
  const { t } = useI18n();
  const id = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
      flowchart: { curve: "basis", padding: 16 },
    });

    void mermaid
      .render(`mmd-${id}`, chart)
      .then(({ svg: rendered }) => {
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, theme, id]);

  if (loading) {
    return <MermaidSkeleton />;
  }

  if (error) {
    return (
      <div
        className={`rounded-[var(--radius-panel)] border border-[var(--priority-p0)]/30 bg-[var(--priority-p0)]/5 p-4 ${className}`}
      >
        <p className="m-0 text-sm text-[var(--priority-p0)]">
          {t("common.renderFailed")}: {error}
        </p>
        <button
          type="button"
          onClick={() => setShowSource((v) => !v)}
          className="focus-ring mt-3 text-xs text-[var(--accent)]"
        >
          {showSource ? t("common.hideSource") : t("common.viewSource")}
        </button>
        {showSource && (
          <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius-card)] bg-[var(--bg-base)] p-3 text-xs">
            {chart}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
