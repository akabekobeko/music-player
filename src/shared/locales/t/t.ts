import type { Locale } from "../types";
import { lookup } from "./lookup";

/**
 * Look up a translation, falling back to the fallback locale and finally
 * to the key itself when no dictionary covers it.
 *
 * Use this short form for one-off lookups; bind a locale once via
 * {@link import("./tFor").tFor} when the consumer also needs `{name}`
 * placeholder interpolation.
 *
 * @param key - Dot-separated translation key (e.g. `"dialog.db.downgrade.title"`).
 * @param locale - Target locale; pass the fallback locale when the user has
 *   not customised their setting.
 * @returns The translated string, the fallback-locale string, or the key
 *   itself when neither resolves.
 */
export const t = (key: string, locale: Locale): string => lookup(key, locale);
