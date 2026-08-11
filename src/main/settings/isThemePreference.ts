import type { ThemePreference } from "../ipc/types";

/** Type guard for {@link ThemePreference} values. */
export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";
