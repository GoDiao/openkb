import { createContext, useContext } from "react";
import type { ThemeId } from "./themes";

export type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  cycleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** @deprecated use ThemeId */
export type Theme = ThemeId;
