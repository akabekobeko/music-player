import { nativeTheme } from "electron";
import type { AppSettings } from "../types";

/**
 * Resolve a theme preference to the dark flag, deferring `"system"` (and
 * unset) to the OS via `nativeTheme`.
 *
 * @param theme - Persisted preference, possibly `undefined`.
 * @returns `true` when the dark palette should be used.
 */
export const isDarkTheme = (theme: AppSettings["theme"]): boolean =>
  theme === "dark" ||
  ((theme === "system" || theme === undefined) &&
    nativeTheme.shouldUseDarkColors);
