import { en } from "./en";
import { ja } from "./ja";
import type {
  Dictionary,
  Locale,
  TranslationKey,
  TranslationParams,
} from "./types";

const dictionaries: Readonly<Record<Locale, Dictionary>> = { en, ja };

/**
 * Replace `{name}` placeholders with values from `params`. Placeholders
 * without a value are left as they are so a missing substitution shows up
 * on the page instead of vanishing.
 */
const interpolate = (template: string, params: TranslationParams): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });

/**
 * Look up a translation for `locale`. Unlike the app's helper there is no
 * fallback chain: every key exists in every dictionary by type, so a lookup
 * cannot miss.
 *
 * @param locale - Locale of the page being rendered.
 * @param key - Translation key.
 * @param params - Optional `{name}` substitutions.
 * @returns The translated string.
 */
export const t = (
  locale: Locale,
  key: TranslationKey,
  params?: TranslationParams,
): string => {
  const text = dictionaries[locale][key];
  return params === undefined ? text : interpolate(text, params);
};

/**
 * Bind `t` to one locale so a component can call `t(key)` repeatedly.
 *
 * @param locale - Locale of the page being rendered.
 * @returns A translate function for that locale.
 */
export const tFor =
  (locale: Locale) =>
  (key: TranslationKey, params?: TranslationParams): string =>
    t(locale, key, params);
