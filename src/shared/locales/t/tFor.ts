import type { BoundTranslate, Locale } from "../types";
import { interpolate } from "./interpolate";
import { lookup } from "./lookup";

/**
 * Bind {@link import("./t").t} to a locale and expose `{name}` placeholder
 * interpolation.
 *
 * Use this when the consumer needs both interpolation and a stable locale —
 * which is everything React (`useLocale`) and the Main-side dialog / menu
 * builders do.
 *
 * @param locale - Locale all subsequent lookups should target.
 * @returns A `(key, params?) => string` helper.
 */
export const tFor =
  (locale: Locale): BoundTranslate =>
  (key, params) => {
    const template = lookup(key, locale);
    return params === undefined ? template : interpolate(template, params);
  };
