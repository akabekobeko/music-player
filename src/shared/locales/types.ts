/**
 * Two-letter locale identifiers supported by the app.
 *
 * The set is intentionally narrow (en / ja) because the dictionaries are
 * hand-authored and every key must exist in both — see `t.test.ts` for the
 * cross-locale parity assertion.
 */
export type Locale = "en" | "ja";

/**
 * User-selectable locale preference persisted in `AppSettings.locale`.
 *
 * `"system"` (the default when unset) tracks the system locale via
 * {@link import("./resolveLocale").resolveLocale}. The resolved value used
 * for translations is always a {@link Locale} — `"system"` never reaches the
 * dictionary lookup itself.
 */
export type LocalePreference = Locale | "system";

/** Map of placeholder name to substitution value (numbers are coerced to string). */
export type TranslationParams = Readonly<Record<string, string | number>>;

/**
 * Locale-bound translation helper produced by
 * {@link import("./t/tFor").tFor}.
 *
 * Always shaped as `(key, params?)` so callers do not need to repeat the
 * locale on every call.
 */
export type BoundTranslate = (
  key: string,
  params?: TranslationParams,
) => string;

/**
 * Single dictionary mapping translation keys to display strings.
 *
 * The shape is "string → string" so the lookup helper (`t`) stays trivial.
 * Keys are dot-separated (e.g. `"dialog.db.downgrade.title"`) by convention;
 * the helper does not interpret the dots — they only exist to keep the table
 * scannable.
 */
export type Dictionary = Readonly<Record<string, string>>;
