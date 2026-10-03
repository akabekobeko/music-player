/**
 * Date formatters by locale. Building one is costly compared with a cell
 * render and every visible row asks for the same one.
 */
const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Format an ISO-8601 timestamp as a date without the time, in the local
 * time zone and the style of the given locale.
 *
 * @param iso - ISO-8601 timestamp (`Music.addedAt`).
 * @param locale - BCP 47 tag of the UI locale.
 * @returns The formatted date, or the raw string when it cannot be parsed.
 */
export const formatAddedDate = (iso: string, locale: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  let formatter = formatters.get(locale);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    formatters.set(locale, formatter);
  }

  return formatter.format(date);
};
