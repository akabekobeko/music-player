import { resolveLocale } from "../../../shared/locales/resolveLocale";
import type { Locale } from "../../../shared/locales/types";
import { useSettings } from "../settings/SettingsProvider";

/**
 * Active UI locale for Renderer components.
 *
 * Resolves the locale from the settings preference (falling back to the
 * browser / OS locale) during render; a plain derived value, recomputed
 * when settings change, no memoisation needed at this size.
 *
 * @returns The locale the UI is shown in.
 */
export const useLocale = (): Locale => {
  const settings = useSettings();
  return resolveLocale({
    preference: settings.locale,
    systemLocale: navigator.language,
  });
};
