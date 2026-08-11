import { FALLBACK_LOCALE } from "../constants";
import { dictionaries } from "../dictionaries";
import type { Locale } from "../types";
import { warnedKeys } from "./warnedKeys";

/**
 * Resolve `key` to a raw template, falling through the standard dictionary
 * cascade.
 *
 * Shared by both {@link import("./t").t} and {@link import("./tFor").tFor} so
 * the fallback / warning behaviour stays single-sourced. Emits one
 * `console.warn` per key that misses every dictionary, deduplicated through
 * {@link warnedKeys}.
 *
 * @param key - Translation key.
 * @param locale - Preferred locale to read first.
 * @returns The dictionary entry, the English fallback, or `key` itself.
 */
export const lookup = (key: string, locale: Locale): string => {
  const primary = dictionaries[locale][key];
  if (primary !== undefined) {
    return primary;
  }

  const fallback = dictionaries[FALLBACK_LOCALE][key];
  if (fallback !== undefined) {
    return fallback;
  }

  if (!warnedKeys.has(key)) {
    warnedKeys.add(key);
    console.warn(`[i18n] missing translation key: ${key}`);
  }

  return key;
};
