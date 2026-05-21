import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../i18n/I18nProvider";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { filterHubSearch, useHubSearch, type HubSearchHit, type HubSearchKind } from "../../hooks/useHubSearch";
import { useTheme } from "../../theme/useTheme";
import { nextThemeId } from "../../theme/themes";

type Command = {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
};

type PaletteItem =
  | { key: string; type: "search"; hit: HubSearchHit }
  | { key: string; type: "command"; cmd: Command };

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
  const { cycleTheme, theme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const { hits, isLoading: searchLoading } = useHubSearch(slug);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
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
        id: "cycle-theme",
        label: t("cmd.cycleTheme", { name: t(`theme.names.${theme}`) }),
        hint: t("cmd.cycleThemeHint", { next: t(`theme.names.${nextThemeId(theme)}`) }),
        action: () => cycleTheme(),
      },
    ];
  }, [slug, navigate, theme, cycleTheme, t]);

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

  const items = useMemo<PaletteItem[]>(() => {
    const searchItems: PaletteItem[] = searchResults.map((hit) => ({
      key: `search-${hit.id}`,
      type: "search",
      hit,
    }));
    const commandItems: PaletteItem[] = filteredCommands.map((cmd) => ({
      key: `cmd-${cmd.id}`,
      type: "command",
      cmd,
    }));
    return [...searchItems, ...commandItems];
  }, [searchResults, filteredCommands]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, items.length]);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items.length]);

  function runItem(item: PaletteItem) {
    if (item.type === "search") {
      navigate(item.hit.path);
    } else {
      item.cmd.action();
    }
    onClose();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) runItem(item);
    }
  }

  const showLoading = searching && slug && searchLoading;
  const showEmpty = searching && !showLoading && items.length === 0;
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
            className="surface-panel relative z-10 w-full max-w-lg overflow-hidden shadow-[var(--shadow-card-hover)] ring-1 ring-[var(--border-subtle)]"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="dialog"
            aria-label={t("nav.commandPalette")}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              className="focus-ring w-full border-0 border-b border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            />
            <ul ref={listRef} className="m-0 max-h-72 list-none overflow-y-auto p-2" role="listbox">
              {showLoading && (
                <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{t("cmd.loading")}</li>
              )}

              {!showLoading &&
                items.map((item, index) => {
                  const active = index === activeIndex;
                  const baseClass = `focus-ring flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--text-primary)] ring-1 ring-[var(--accent)]/30"
                      : "hover:bg-[var(--accent-soft)]/60"
                  }`;

                  if (item.type === "search") {
                    return (
                      <li key={item.key} role="option" aria-selected={active}>
                        <button type="button" onClick={() => runItem(item)} className={baseClass}>
                          <span className="min-w-0 truncate">{item.hit.label}</span>
                          <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                            {kindLabel(item.hit.kind, t)} · {item.hit.hint}
                          </span>
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.key} role="option" aria-selected={active}>
                      <button type="button" onClick={() => runItem(item)} className={baseClass}>
                        <span>{item.cmd.label}</span>
                        {item.cmd.hint && (
                          <kbd className="rounded bg-[var(--bg-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                            {item.cmd.hint}
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })}

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
