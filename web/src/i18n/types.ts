import type { en } from "./en";

/** Locales the site is built in. Mirrors `locales` in astro.config.ts. */
export type Locale = "en" | "ja";

/** Every translation key, taken from the English dictionary. */
export type TranslationKey = keyof typeof en;

/** A full dictionary: one string per key, no omissions. */
export type Dictionary = Readonly<Record<TranslationKey, string>>;

/** Map of placeholder name to substitution value. */
export type TranslationParams = Readonly<Record<string, string | number>>;
