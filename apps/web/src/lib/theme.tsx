/**
 * Theme context — light / dark mode.
 *
 * Strategy:
 * 1. On mount, read from localStorage (`packetflow:theme`).
 *    If no stored value, fall back to the OS preference via
 *    `prefers-color-scheme: dark`.
 * 2. Apply or remove the `dark` class on `<html>` whenever `theme` changes
 *    (Tailwind's `darkMode: ["class"]` strategy).
 * 3. Persist any user toggle back to localStorage.
 *
 * Usage:
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 * ```
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "packetflow:theme";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read stored preference, or resolve from OS. */
function resolveInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage blocked (private browsing, etc.) — fall through
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Toggle the `dark` class on the root HTML element. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialise synchronously so there's no flash on the first paint.
  // resolveInitialTheme() runs client-side only — safe because Vite apps
  // are SPA; no SSR to worry about here.
  const [theme, setTheme] = useState<Theme>(() => {
    const t = resolveInitialTheme();
    applyTheme(t);
    return t;
  });

  // Keep the class in sync whenever theme changes (covers programmatic calls).
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
