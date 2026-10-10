import type { Locale } from "../i18n/types";

/**
 * Format an ISO 8601 timestamp (a GitHub release `published_at`) as a date
 * in the given locale, e.g. "October 10, 2026" / "2026年10月10日". The date
 * is taken in UTC so the build machine's time zone cannot shift it.
 *
 * @param locale - Locale of the page being rendered.
 * @param iso - ISO 8601 timestamp.
 * @returns The formatted date.
 */
export const formatReleaseDate = (locale: Locale, iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
