import type { TranslationParams } from "../types";

/**
 * Replace `{name}` placeholders in `template` with values from `params`.
 *
 * Placeholders without a matching key are left untouched (rather than
 * silently emptied) so a missing substitution surfaces visually in the UI
 * instead of disappearing.
 *
 * @param template - Resolved dictionary string.
 * @param params - Substitution map.
 * @returns The interpolated string.
 */
export const interpolate = (
  template: string,
  params: TranslationParams,
): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
