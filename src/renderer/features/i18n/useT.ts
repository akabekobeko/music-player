import { resolveLocale } from "../../../shared/locales/resolveLocale";
import { tFor } from "../../../shared/locales/t/tFor";
import type { BoundTranslate } from "../../../shared/locales/types";
import { useSettings } from "../settings/SettingsProvider";

/**
 * Locale-bound translation hook for Renderer components.
 *
 * Resolves the locale from the settings preference (falling back to the
 * browser / OS locale) during render — a plain derived value, recomputed
 * when settings change, no memoisation needed at this size.
 *
 * @returns A `(key, params?) => string` helper bound to the active locale.
 */
export const useT = (): BoundTranslate => {
  const settings = useSettings();
  return tFor(
    resolveLocale({
      preference: settings.locale,
      systemLocale: navigator.language,
    }),
  );
};
