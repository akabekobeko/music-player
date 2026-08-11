import type { ThemePreference } from "@mp/ipc";

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
