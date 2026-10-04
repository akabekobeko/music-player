/**
 * File name stem of a name: lower-cased ASCII letters and digits joined by
 * hyphens.
 *
 * @param text - Artist name or album title.
 * @returns The stem; empty when the text has no ASCII letter or digit (a
 *   Japanese title, for example), so the caller must supply a fallback.
 */
export const slugOf = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
