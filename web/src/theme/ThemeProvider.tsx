import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import {
  isThemeDark,
  nextThemeId,
  normalizeThemeId,
  type ThemeId,
} from "./themes";
import { ThemeContext } from "./useTheme";

const STORAGE_KEY = "openkb-theme";
const DEFAULT_THEME: ThemeId = "dusk";

function resolveInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = normalizeThemeId(localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dusk" : "dawn";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(resolveInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => nextThemeId(current));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { isThemeDark };
