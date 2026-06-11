/**
 * Theme context for the mobile app — light / dark, mirroring the web app.
 *
 * Resolution: stored preference (SecureStore) → device colour scheme. The
 * user can toggle it from the Profile screen; the choice is persisted.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { getItem, setItem } from "../lib/storage";
import { darkColors, lightColors, type ThemeColors, type ThemeName } from "./tokens";

const STORAGE_KEY = "packetflow_theme";

interface ThemeContextValue {
  theme: ThemeName;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") setThemeState(stored);
      } catch {
        // ignore — fall back to device scheme
      }
    })();
  }, []);

  const persist = (t: ThemeName) => {
    setItem(STORAGE_KEY, t).catch(() => {});
  };

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    persist(t);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
