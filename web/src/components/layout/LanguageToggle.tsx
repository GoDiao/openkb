import { useI18n, type Locale } from "../../i18n/I18nProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  function cycle() {
    const next: Locale = locale === "en" ? "zh-CN" : "en";
    setLocale(next);
  }

  const label = locale === "en" ? t("lang.zh") : t("lang.en");
  const title = locale === "en" ? t("lang.switchToZh") : t("lang.switchToEn");

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={title}
      title={title}
      className="focus-ring rounded-[var(--radius-card)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {label}
    </button>
  );
}
