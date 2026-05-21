import { useEffect, useMemo, useState } from "react";

import { Link, Outlet, useLocation, useParams } from "react-router-dom";

import { useI18n } from "../../i18n/I18nProvider";

import { useProjects } from "../../hooks/useProjects";

import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

import { CommandPalette, useCommandPalette } from "./CommandPalette";

import { LanguageToggle } from "./LanguageToggle";

import { ThemePicker } from "./ThemePicker";

import { PageTransition } from "../ui/PageTransition";

import { ScrollToTop } from "../ui/ScrollToTop";

import { ShortcutsHelpModal } from "../ui/ShortcutsHelpModal";



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

  const [shortcutsOpen, setShortcutsOpen] = useState(false);



  useKeyboardShortcuts(!open && !shortcutsOpen);



  useEffect(() => {

    const handler = (e: KeyboardEvent) => {

      const target = e.target as HTMLElement;

      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (typing || open || shortcutsOpen) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {

        e.preventDefault();

        setShortcutsOpen(true);

      }

    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);

  }, [open, shortcutsOpen]);



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

      <header className="glass-header sticky top-0 z-40 border-b border-[var(--border-subtle)]">

        <div className="mx-auto flex h-[4.25rem] max-w-[1600px] items-center justify-between gap-6 px-6">

          <div className="flex min-w-0 items-center gap-5">

            <Link

              to="/"

              className="group font-display shrink-0 text-xl font-semibold tracking-tight text-[var(--text-primary)] no-underline"

            >

              Open

              <span className="text-[var(--accent)] transition group-hover:opacity-80">KB</span>

            </Link>

            <nav

              className="hidden min-w-0 items-center gap-2 text-sm text-[var(--text-muted)] sm:flex"

              aria-label="Breadcrumb"

            >

              {crumbs.map((c, i) => (

                <span key={`${c.to}-${i}`} className="flex min-w-0 items-center gap-2">

                  {i > 0 && <span className="opacity-30">/</span>}

                  {i < crumbs.length - 1 ? (

                    <Link

                      to={c.to}

                      className="truncate text-[var(--text-muted)] no-underline transition hover:text-[var(--accent)]"

                    >

                      {c.label}

                    </Link>

                  ) : (

                    <span className="truncate font-medium text-[var(--text-primary)]">{c.label}</span>

                  )}

                </span>

              ))}

            </nav>

          </div>

          <div className="flex items-center gap-1.5">

            <Link to="/help" className="btn-ghost focus-ring hidden sm:inline-flex">

              {t("nav.help")}

            </Link>

            <button

              type="button"

              onClick={() => setShortcutsOpen(true)}

              className="focus-ring hidden items-center gap-1.5 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:flex"

              title={t("shortcuts.title")}

            >

              <kbd className="font-mono rounded bg-[var(--bg-base)] px-1.5 py-0.5 text-[10px] opacity-70">⌃/</kbd>

            </button>

            <button

              type="button"

              onClick={() => setOpen(true)}

              className="focus-ring hidden items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:flex"

              title={t("nav.commandPalette")}

            >

              <span>{t("nav.cmdK")}</span>

              <kbd className="font-mono rounded bg-[var(--bg-base)] px-1.5 py-0.5 text-[10px] opacity-70">⌘K</kbd>

            </button>

            <LanguageToggle />

            <ThemePicker />

          </div>

        </div>

      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-8 md:py-10">

        <PageTransition>

          <Outlet />

        </PageTransition>

      </main>

      <ScrollToTop />

      <CommandPalette open={open} onClose={() => setOpen(false)} />

      <ShortcutsHelpModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

    </div>

  );

}

