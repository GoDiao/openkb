import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useEscapeKey } from "../../hooks/useEscapeKey";

type ShortcutRow = {
  keys: string[];
  labelKey: string;
};

const ROWS: ShortcutRow[] = [
  { keys: ["⌘", "K"], labelKey: "shortcuts.cmdPalette" },
  { keys: ["?"], labelKey: "shortcuts.searchPalette" },
  { keys: ["Ctrl", "/"], labelKey: "shortcuts.openHelp" },
  { keys: ["g", "o"], labelKey: "shortcuts.goOverview" },
  { keys: ["g", "k"], labelKey: "shortcuts.goKanban" },
  { keys: ["g", "s"], labelKey: "shortcuts.goSpec" },
  { keys: ["g", "p"], labelKey: "shortcuts.goPlan" },
  { keys: ["g", "g"], labelKey: "shortcuts.goGraph" },
  { keys: ["g", "d"], labelKey: "shortcuts.goDecisions" },
  { keys: ["g", "h"], labelKey: "shortcuts.goHelp" },
  { keys: ["Esc"], labelKey: "shortcuts.close" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutsHelpModal({ open, onClose }: Props) {
  const { t } = useI18n();
  useEscapeKey(onClose, open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[var(--backdrop-blur)]"
            aria-label={t("common.close")}
            onClick={onClose}
          />
          <motion.div
            className="surface-panel relative z-10 w-full max-w-md overflow-hidden ring-1 ring-[var(--border-subtle)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="dialog"
            aria-label={t("shortcuts.title")}
            data-testid="shortcuts-help-modal"
          >
            <div className="border-b border-[var(--border-subtle)] bg-[var(--accent-soft)]/20 px-6 py-4">
              <h2 className="font-display m-0 text-xl">{t("shortcuts.title")}</h2>
              <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">{t("shortcuts.subtitle")}</p>
            </div>
            <ul className="m-0 max-h-[60vh] list-none space-y-1 overflow-y-auto p-3">
              {ROWS.map((row) => (
                <li
                  key={row.labelKey}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] px-3 py-2.5"
                >
                  <span className="text-sm text-[var(--text-primary)]">{t(row.labelKey)}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {row.keys.map((key) => (
                      <kbd
                        key={`${row.labelKey}-${key}`}
                        className="rounded border border-[var(--border-subtle)] bg-[var(--bg-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useShortcutsHelpModal() {
  return useState(false);
}
