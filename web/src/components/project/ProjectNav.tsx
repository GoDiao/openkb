import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

const TABS: { to: string; key: string; end?: boolean }[] = [
  { to: "", key: "", end: true },
  { to: "kanban", key: "kanban" },
  { to: "spec", key: "spec" },
  { to: "plan", key: "plan" },
  { to: "graph", key: "graph" },
  { to: "decisions", key: "decisions" },
];

const TAB_I18N_KEYS: Record<string, string> = {
  "": "tabs.overview",
  kanban: "tabs.kanban",
  spec: "tabs.spec",
  plan: "tabs.plan",
  graph: "tabs.graph",
  decisions: "tabs.decisions",
};

export function ProjectNav() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const base = `/projects/${slug}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `focus-ring block rounded-[var(--radius-card)] px-4 py-2.5 text-sm font-medium no-underline transition ${
      isActive
        ? "bg-[var(--bg-elevated)] text-[var(--accent)] shadow-[inset_0_-2px_0_var(--accent)] md:rounded-t-[var(--radius-card)] md:rounded-b-none"
        : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <nav className="mb-8" aria-label={t("nav.overview")}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-px md:hidden">
        <span className="text-sm font-medium text-[var(--text-primary)]">{t("nav.overview")}</span>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="focus-ring rounded-[var(--radius-card)] border border-[var(--border-subtle)] px-3 py-1.5 text-sm"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? t("common.collapse") : t("common.menu")}
        </button>
      </div>

      <div
        className={`flex flex-col gap-1 md:flex-row md:flex-wrap ${
          mobileOpen ? "mt-2" : "hidden md:flex"
        }`}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.key || "overview"}
            to={tab.to ? `${base}/${tab.to}` : base}
            end={tab.end ?? false}
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            {t(TAB_I18N_KEYS[tab.key] ?? "tabs.overview")}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
