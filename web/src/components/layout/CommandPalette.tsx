import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { filterHubSearch, useHubSearch, type HubSearchHit, type HubSearchKind } from "../../hooks/useHubSearch";
import { useTheme } from "../../theme/useTheme";

type Command = {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function kindLabel(kind: HubSearchKind, t: (key: string) => string): string {
  const keys: Record<HubSearchKind, string> = {
    task: "cmd.kindTask",
    phase: "cmd.kindPhase",
    decision: "cmd.kindDecision",
    plan: "cmd.kindPlan",
  };
  return t(keys[kind]);
}

export function CommandPalette({ open, onClose }: Props) {
  const { t } = useI18n();
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();
  const [query, setQuery] = useState("");
  const { hits, isLoading: searchLoading } = useHubSearch(slug);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const base = slug ? `/projects/${slug}` : "";
    const nav: Command[] = slug
      ? [
          { id: "go-overview", label: t("cmd.goOverview"), hint: "g o", action: () => navigate(base) },
          { id: "go-kanban", label: t("cmd.goKanban"), hint: "g k", action: () => navigate(`${base}/kanban`) },
          { id: "go-spec", label: t("cmd.goSpec"), action: () => navigate(`${base}/spec`) },
          { id: "go-plan", label: t("cmd.goPlan"), action: () => navigate(`${base}/plan`) },
          { id: "go-graph", label: t("cmd.goGraph"), action: () => navigate(`${base}/graph`) },
          { id: "go-decisions", label: t("cmd.goDecisions"), action: () => navigate(`${base}/decisions`) },
        ]
      : [{ id: "go-projects", label: t("cmd.goProjects"), action: () => navigate("/") }];

    return [
      { id: "go-help", label: t("cmd.goHelp"), action: () => navigate("/help") },
      ...nav,
      {
        id: "toggle-theme",
        label: theme === "dark" ? t("cmd.toggleThemeLight") : t("cmd.toggleThemeDark"),
        action: () => toggleTheme(),
      },
    ];
  }, [slug, navigate, theme, toggleTheme, t]);

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  const searchResults = useMemo(
    () => (searching && slug ? filterHubSearch(hits, trimmed) : []),
    [searching, slug, hits, trimmed],
  );

  const filteredCommands = useMemo(() => {
    if (!searching) return commands;
    const q = trimmed.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, searching, trimmed]);

  function runCommand(cmd: Command) {
    cmd.action();
    onClose();
  }

  function runSearchHit(hit: HubSearchHit) {
    navigate(hit.path);
    onClose();
  }

  const showLoading = searching && slug && searchLoading;
  const showEmpty =
    searching && !showLoading && searchResults.length === 0 && filteredCommands.length === 0;

  const placeholder = slug ? t("cmd.search") : t("cmd.searchCommands");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[var(--backdrop-blur)]"
            aria-label={t("common.close")}
            onClick={onClose}
          />
          <motion.div
            className="surface-panel relative z-10 w-full max-w-lg overflow-hidden shadow-[var(--shadow-card-hover)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            role="dialog"
            aria-label={t("nav.commandPalette")}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="focus-ring w-full border-0 border-b border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            />
            <ul className="m-0 max-h-72 list-none overflow-y-auto p-2">
              {showLoading && (
                <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{t("cmd.loading")}</li>
              )}

              {!showLoading &&
                searchResults.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => runSearchHit(hit)}
                      className="focus-ring flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-[var(--accent-soft)]"
                    >
                      <span className="min-w-0 truncate">{hit.label}</span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                        {kindLabel(hit.kind, t)} · {hit.hint}
                      </span>
                    </button>
                  </li>
                ))}

              {!showLoading &&
                filteredCommands.map((cmd) => (
                  <li key={cmd.id}>
                    <button
                      type="button"
                      onClick={() => runCommand(cmd)}
                      className="focus-ring flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-[var(--accent-soft)]"
                    >
                      <span>{cmd.label}</span>
                      {cmd.hint && (
                        <kbd className="rounded bg-[var(--bg-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                          {cmd.hint}
                        </kbd>
                      )}
                    </button>
                  </li>
                ))}

              {showEmpty && (
                <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{t("cmd.noMatch")}</li>
              )}
            </ul>
            <p className="m-0 border-t border-[var(--border-subtle)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
              {t("cmd.footer")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
