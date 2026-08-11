import { sortKeyWithoutArticle } from "./sortKeyWithoutArticle";

/**
 * Comparator for article-blind, case-insensitive name order
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * @param a - One name.
 * @param b - Another name.
 * @returns Negative / zero / positive per `Array.prototype.sort`.
 */
export const compareNameWithoutArticle = (a: string, b: string): number => {
  const keyA = sortKeyWithoutArticle(a);
  const keyB = sortKeyWithoutArticle(b);
  if (keyA < keyB) {
    return -1;
  }

  if (keyA > keyB) {
    return 1;
  }

  // Stable tiebreak on the raw names ("A Day" vs "The Day").
  return a < b ? -1 : a > b ? 1 : 0;
};
