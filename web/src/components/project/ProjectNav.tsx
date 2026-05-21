import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { WatchStatusBadge } from "../ui/WatchStatusBadge";
import { TabShortcutHint } from "./TabShortcutHint";
import { projectTabAriaKeyshortcuts } from "../../constants/projectShortcuts";

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

type TabProps = {
  tab: (typeof TABS)[number];
  base: string;
  layoutId: string;
  onNavigate?: () => void;
  showShortcut?: boolean;
};

function ProjectTabItem({ tab, base, layoutId, onNavigate, showShortcut = true }: TabProps) {
  const { t } = useI18n();
  const label = t(TAB_I18N_KEYS[tab.key] ?? "tabs.overview");
  const ariaKeys = projectTabAriaKeyshortcuts(tab.key);
  const shortcutHint =
    showShortcut && ariaKeys ? t("nav.tabShortcut", { key: ariaKeys.replace("g ", "") }) : undefined;

  return (
    <NavLink
      to={tab.to ? `${base}/${tab.to}` : base}
      end={tab.end ?? false}
      onClick={onNavigate}
      title={shortcutHint}
      aria-keyshortcuts={showShortcut ? ariaKeys : undefined}
      className="group/tab focus-ring relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium no-underline transition-colors"
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative z-10 transition-colors ${
              isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </span>
          {showShortcut && shortcutHint && <span className="sr-only">{shortcutHint}</span>}
          {showShortcut && <TabShortcutHint tabKey={tab.key} />}
          {isActive && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export function ProjectNav() {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const base = `/projects/${slug}`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="mb-8" aria-label={t("nav.overview")}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-px">
        <div className="flex min-w-0 flex-1 items-center md:hidden">
          <span className="text-sm font-medium text-[var(--text-primary)]">{t("nav.overview")}</span>
        </div>

        <div
          className={`min-w-0 flex-1 flex-wrap items-center ${
            mobileOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {TABS.map((tab) => (
            <ProjectTabItem
              key={tab.key || "overview"}
              tab={tab}
              base={base}
              layoutId="project-tab-indicator"
              onNavigate={closeMobile}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 pb-2">
          <WatchStatusBadge />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="focus-ring rounded-[var(--radius-card)] border border-[var(--border-subtle)] px-3 py-1.5 text-sm md:hidden"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? t("common.collapse") : t("common.menu")}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mt-2 flex flex-col gap-1 border-b border-[var(--border-subtle)] md:hidden">
          {TABS.map((tab) => (
            <ProjectTabItem
              key={`mobile-${tab.key || "overview"}`}
              tab={tab}
              base={base}
              layoutId="project-tab-indicator-mobile"
              onNavigate={closeMobile}
              showShortcut={false}
            />
          ))}
        </div>
      )}
    </nav>
  );
}
