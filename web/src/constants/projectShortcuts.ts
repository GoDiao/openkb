/** Vim-style `g` + key navigation within a project */
export const PROJECT_TAB_SHORTCUTS: Record<string, string> = {
  "": "o",
  kanban: "k",
  spec: "s",
  plan: "p",
  graph: "g",
  decisions: "d",
};

export const PROJECT_ROUTE_SHORTCUTS: Record<string, string> = {
  o: "",
  k: "kanban",
  s: "spec",
  p: "plan",
  g: "graph",
  d: "decisions",
};

/** Space-separated keys for aria-keyshortcuts (sequential g + letter). */
export function projectTabAriaKeyshortcuts(tabKey: string): string | undefined {
  const letter = PROJECT_TAB_SHORTCUTS[tabKey];
  return letter ? `g ${letter}` : undefined;
}
