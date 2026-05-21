import { useI18n } from "../../i18n/I18nProvider";

type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`shimmer rounded-[var(--radius-card)] bg-[var(--border-subtle)] ${className}`}
      aria-hidden
    />
  );
}

type DocSkeletonProps = {
  kind?: "spec" | "plan";
};

export function DocSkeleton({ kind }: DocSkeletonProps = {}) {
  const { t } = useI18n();
  const label =
    kind === "spec"
      ? t("spec.loading")
      : kind === "plan"
        ? t("plan.loading")
        : t("common.loadingDoc");

  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      <Skeleton className="h-8 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-6 h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

export function MermaidSkeleton({ className = "" }: Props) {
  const { t } = useI18n();

  return (
    <div
      className={`flex min-h-[240px] items-center justify-center rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 backdrop-blur-sm ${className}`}
      aria-busy="true"
      aria-label={t("common.rendering")}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent)]" />
        <p className="m-0 text-sm text-[var(--text-muted)]">{t("common.rendering")}</p>
      </div>
    </div>
  );
}
