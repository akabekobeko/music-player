/**
 * Article pattern for article-blind name sorting
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
