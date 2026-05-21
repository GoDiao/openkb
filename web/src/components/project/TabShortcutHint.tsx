import { PROJECT_TAB_SHORTCUTS } from "../../constants/projectShortcuts";

type Props = {
  tabKey: string;
  className?: string;
};

export function TabShortcutHint({ tabKey, className = "" }: Props) {
  const shortcut = PROJECT_TAB_SHORTCUTS[tabKey];
  if (!shortcut) return null;

  return (
    <span
      className={`pointer-events-none hidden items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/tab:opacity-100 md:inline-flex ${className}`}
      aria-hidden
    >
      <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-1 py-px font-mono text-[9px] leading-none text-[var(--text-muted)]">
        g
      </kbd>
      <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-1 py-px font-mono text-[9px] leading-none text-[var(--text-muted)]">
        {shortcut}
      </kbd>
    </span>
  );
}

export function tabShortcutTitle(tabKey: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  const shortcut = PROJECT_TAB_SHORTCUTS[tabKey];
  if (!shortcut) return undefined;
  return t("nav.tabShortcut", { key: shortcut });
}
