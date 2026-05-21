export const THEME_IDS = [
  "dawn",
  "dusk",
  "ocean",
  "forest",
  "rose",
  "mono",
  "aurora",
  "paper",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeMode = "light" | "dark";

export type ThemeDefinition = {
  id: ThemeId;
  icon: string;
  mode: ThemeMode;
  /** Accent swatch for the theme picker */
  swatch: string;
};

export const THEMES: ThemeDefinition[] = [
  { id: "dawn", icon: "☀", mode: "light", swatch: "#9a7b4f" },
  { id: "dusk", icon: "☾", mode: "dark", swatch: "#c9a87c" },
  { id: "ocean", icon: "⌁", mode: "dark", swatch: "#5eb8d4" },
  { id: "forest", icon: "🌿", mode: "dark", swatch: "#6fbf8a" },
  { id: "rose", icon: "✿", mode: "light", swatch: "#c97b8e" },
  { id: "mono", icon: "◐", mode: "light", swatch: "#52525b" },
  { id: "aurora", icon: "✦", mode: "dark", swatch: "#a78bfa" },
  { id: "paper", icon: "📄", mode: "light", swatch: "#8b6914" },
];

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  light: "dawn",
  dark: "dusk",
};

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function normalizeThemeId(value: string | null): ThemeId | null {
  if (!value) return null;
  if (isThemeId(value)) return value;
  return LEGACY_THEME_MAP[value] ?? null;
}

export function isThemeDark(theme: ThemeId): boolean {
  return THEMES.find((t) => t.id === theme)?.mode === "dark";
}

export function nextThemeId(current: ThemeId): ThemeId {
  const idx = THEME_IDS.indexOf(current);
  return THEME_IDS[(idx + 1) % THEME_IDS.length];
}

export function getThemeDefinition(theme: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === theme) ?? THEMES[0];
}
