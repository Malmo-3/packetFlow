/**
 * Design tokens for the mobile app — a direct port of the web app's
 * "Uber-inspired black-and-white duet" (apps/web/src/index.css), converted from
 * HSL CSS variables to React Native hex colours.
 *
 * LIGHT: white canvas, black ink, gray surfaces.
 * DARK:  near-black canvas, near-white ink, elevated dark surfaces.
 */
import type { PackageStatus } from "@packetflow/types";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
  /** Subtle translucent fill used behind sections. */
  surface: string;
}

export const lightColors: ThemeColors = {
  background: "#ffffff",
  foreground: "#000000",
  card: "#ffffff",
  cardForeground: "#000000",
  secondary: "#efefef",
  secondaryForeground: "#000000",
  muted: "#f3f3f3",
  mutedForeground: "#5e5e5e",
  border: "#e2e2e2",
  input: "#efefef",
  primary: "#000000",
  primaryForeground: "#ffffff",
  destructive: "#dc2626",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  warning: "#f59e0b",
  info: "#2563eb",
  surface: "#f7f7f7",
};

export const darkColors: ThemeColors = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  card: "#141414",
  cardForeground: "#fafafa",
  secondary: "#1e1e1e",
  secondaryForeground: "#fafafa",
  muted: "#1a1a1a",
  mutedForeground: "#8a8a8a",
  border: "#282828",
  input: "#1e1e1e",
  primary: "#fafafa",
  primaryForeground: "#0a0a0a",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  surface: "#121212",
};

export type ThemeName = "light" | "dark";

export const radius = { sm: 8, md: 12, lg: 16, pill: 9999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Per-status badge palette (bg + text), one entry per theme. */
export interface StatusStyle {
  bg: string;
  text: string;
}

export const statusStyles: Record<ThemeName, Record<PackageStatus, StatusStyle>> = {
  light: {
    registered: { bg: "#f1f1f1", text: "#444444" },
    in_transit: { bg: "#e0edff", text: "#1d4ed8" },
    out_for_delivery: { bg: "#fef3c7", text: "#b45309" },
    delivered: { bg: "#dcfce7", text: "#15803d" },
    exception: { bg: "#fee2e2", text: "#b91c1c" },
  },
  dark: {
    registered: { bg: "#272727", text: "#cfcfcf" },
    in_transit: { bg: "#16244a", text: "#93c5fd" },
    out_for_delivery: { bg: "#3a2c08", text: "#fcd34d" },
    delivered: { bg: "#0f2e1c", text: "#86efac" },
    exception: { bg: "#3a1414", text: "#fca5a5" },
  },
};
