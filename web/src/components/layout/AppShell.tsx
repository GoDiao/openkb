import { useMemo } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";
import { useProjects } from "../../hooks/useProjects";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

const TAB_I18N_KEYS: Record<string, string> = {
  "": "tabs.overview",
  overview: "tabs.overview",
  kanban: "tabs.kanban",
  spec: "tabs.spec",
  plan: "tabs.plan",
  graph: "tabs.graph",
  decisions: "tabs.decisions",
};

export function AppShell() {
  const { t } = useI18n();
  const location = useLocation();
  const { slug } = useParams();
  const { data: projects } = useProjects();
  const { open, setOpen } = useCommandPalette();

  const tabSegment = useMemo(() => {
    if (!slug) return "";
    const parts = location.pathname.split("/").filter(Boolean);
    return parts[2] ?? "";
  }, [location.pathname, slug]);

  const projectName = projects?.find((p) => p.slug === slug)?.name ?? slug;
  const tabKey = TAB_I18N_KEYS[tabSegment] ?? TAB_I18N_KEYS[""];
  const tabLabel = tabKey ? t(tabKey) : undefined;

  const crumbs = useMemo(() => {
    if (location.pathname === "/help") {
      return [
        { label: t("nav.projects"), to: "/" },
        { label: t("help.title"), to: "/help" },
      ];
    }
    if (location.pathname === "/") return [{ label: t("nav.projects"), to: "/" }];
    if (slug) {
      return [
        { label: t("nav.projects"), to: "/" },
        { label: projectName ?? slug, to: `/projects/${slug}` },
        ...(tabSegment ? [{ label: tabLabel ?? tabSegment, to: location.pathname }] : []),
      ];
    }
    return [{ label: t("nav.projects"), to: "/" }];
  }, [location.pathname, slug, projectName, tabSegment, tabLabel, t]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-[var(--backdrop-blur)]">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/"
              className="font-display shrink-0 text-xl font-semibold tracking-tight text-[var(--text-primary)] no-underline"
            >
              Open<span className="text-[var(--accent)]">KB</span>
            </Link>
            <nav className="hidden min-w-0 items-center gap-2 text-sm text-[var(--text-muted)] sm:flex" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={`${c.to}-${i}`} className="flex min-w-0 items-center gap-2">
                  {i > 0 && <span className="opacity-40">/</span>}
                  {i < crumbs.length - 1 ? (
                    <Link to={c.to} className="truncate text-[var(--text-muted)] no-underline hover:text-[var(--accent)]">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate text-[var(--text-primary)]">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/help"
              className="focus-ring hidden rounded-[var(--radius-card)] border border-transparent px-3 py-1.5 text-xs text-[var(--text-muted)] no-underline hover:border-[var(--border-subtle)] hover:text-[var(--accent)] sm:block"
            >
              {t("nav.help")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] sm:block"
              title={t("nav.commandPalette")}
            >
              {t("nav.cmdK")}
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-8">
        <Outlet />
      </main>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
