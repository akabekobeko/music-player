/**
 * Article-blind name comparison for artist sorting
 * (`docs/specs/v1.0/features/artist-view.md`; ported from audio-player's
 * `compareNameWithoutThe`): "The Beatles" sorts under B, "A Perfect Circle"
 * under P, "Thee Michelle Gun Elephant" under M.
 */

const ARTICLE_PATTERN = /^(the|a|thee)\s+/i;

/**
 * Sort key of a name with any leading article removed.
 *
 * @param name - Display name.
 * @returns Lower-cased key without the article prefix.
 */
export const sortKeyWithoutArticle = (name: string): string =>
  name.trim().replace(ARTICLE_PATTERN, "").toLowerCase();

/**
 * Comparator for article-blind, case-insensitive name order.
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
