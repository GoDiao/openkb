import { useWatchStatus } from "../../hooks/useProjectWatch";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import type { WatchStatus } from "../../hooks/useProjectWatch";

const STATUS_STYLE: Record<
  WatchStatus,
  { dot: string; pulse?: boolean }
> = {
  idle: { dot: "bg-[var(--text-muted)]/40" },
  connecting: { dot: "bg-[var(--phase-pending)]", pulse: true },
  connected: { dot: "bg-[var(--phase-done)]" },
  reconnecting: { dot: "bg-[var(--phase-active)]", pulse: true },
};

const STATUS_LABEL: Record<WatchStatus, string> = {
  idle: "watch.statusIdle",
  connecting: "watch.statusConnecting",
  connected: "watch.statusConnected",
  reconnecting: "watch.statusReconnecting",
};

export function WatchStatusBadge() {
  const { t } = useI18n();
  const status = useWatchStatus();
  const style = STATUS_STYLE[status];

  if (status === "idle") return null;

  return (
    <span
      data-testid="watch-status-badge"
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 px-2.5 py-1 text-[10px] text-[var(--text-muted)]"
      title={t(STATUS_LABEL[status])}
    >
      <span className="relative flex h-2 w-2">
        {style.pulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${style.dot} opacity-40`}
            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={`relative h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      </span>
      <span className="hidden sm:inline">{t(STATUS_LABEL[status])}</span>
    </span>
  );
}

export { type WatchStatus };
