import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/useTheme";
import { getThemeDefinition, THEMES, type ThemeId } from "../../theme/themes";

export function ThemePicker() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getThemeDefinition(theme);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(next: ThemeId) {
    setTheme(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("theme.pick")}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t("theme.pick")}
        className="focus-ring flex h-10 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
      >
        <motion.span
          key={theme}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="text-base leading-none"
          aria-hidden
        >
          {current.icon}
        </motion.span>
        <span className="hidden max-w-[5rem] truncate text-xs font-medium sm:inline">
          {t(`theme.names.${theme}`)}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label={t("theme.pick")}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-56 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-card-hover)]"
          >
            <p className="m-0 px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {t("theme.pick")}
            </p>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {THEMES.map((item) => {
                const selected = item.id === theme;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => pick(item.id)}
                      className={`focus-ring flex w-full items-center gap-3 rounded-[var(--radius-card)] px-2 py-2 text-left text-sm transition ${
                        selected
                          ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-sm"
                        style={{ backgroundColor: `${item.swatch}22`, color: item.swatch }}
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-tight">{t(`theme.names.${item.id}`)}</span>
                        <span className="block text-xs text-[var(--text-muted)]">
                          {t(`theme.desc.${item.id}`)}
                        </span>
                      </span>
                      {selected && (
                        <span className="text-[var(--accent)]" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
