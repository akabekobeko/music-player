import type { ThemePreference } from "@mp/ipc";

/**
 * Theme application (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * The `.dark` class on `<html>` is set directly by the three handlers that
 * can change the effective theme — bootstrap, the `setTheme` command, and the
 * OS theme listener — never by a `useEffect` syncing after render.
 */

/** The theme actually rendered ("system" resolves to one of these). */
export type ResolvedTheme = "light" | "dark";

/**
 * Resolve a preference against the current OS appearance.
 *
 * @param preference - Persisted preference; `undefined` behaves as "system".
 * @param systemPrefersDark - `prefers-color-scheme: dark` match state.
 * @returns The theme to render.
 */
export const resolveTheme = (
  preference: ThemePreference | undefined,
  systemPrefersDark: boolean,
): ResolvedTheme => {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemPrefersDark ? "dark" : "light";
};

/**
 * Last preference passed to {@link applyThemePreference}; the OS theme
 * listener re-resolves against this without needing React state.
 */
let currentPreference: ThemePreference | undefined;

/** The media query both appliers resolve "system" against. */
const darkQuery = (): MediaQueryList =>
  window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Apply a theme preference to `<html>` and remember it for the OS listener.
 *
 * @param preference - The preference now in effect.
 */
export const applyThemePreference = (
  preference: ThemePreference | undefined,
): void => {
  currentPreference = preference;
  const resolved = resolveTheme(preference, darkQuery().matches);
  document.documentElement.classList.toggle("dark", resolved === "dark");
};

/**
 * Register the `matchMedia` listener that keeps a "system" preference in
 * sync with OS appearance changes. App-lifetime: called once from the
 * bootstrap, never unregistered.
 */
export const watchSystemTheme = (): void => {
  darkQuery().addEventListener("change", () => {
    if (currentPreference === undefined || currentPreference === "system") {
      applyThemePreference(currentPreference);
    }
  });
};
