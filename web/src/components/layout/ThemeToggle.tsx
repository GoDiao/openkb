import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/useTheme";

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const tooltip = isDark ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={tooltip}
      title={tooltip}
      className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-lg leading-none"
        aria-hidden
      >
        {isDark ? "☀" : "☾"}
      </motion.span>
    </button>
  );
}
