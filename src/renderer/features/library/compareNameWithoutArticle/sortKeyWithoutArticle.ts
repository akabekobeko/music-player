/**
 * Leading articles ignored for article-blind name sorting
 * (`docs/specs/v1.0/features/artist-view.md`; grown from audio-player's
 * `compareNameWithoutThe`). Lower-cased — names are lower-cased before the
 * match, so "THEE MICHELLE GUN ELEPHANT" and "Thee Oh Sees" both drop the
 * article.
 *
 * Only whitespace-separated words count. Elided forms ("L'Arc-en-Ciel") and
 * articles that collide with common English words as a first word are left
 * alone on purpose: Italian "i" ("I Am Kloot"), Portuguese "as" ("As I Lay
 * Dying") and "um".
 */
const ARTICLES = [
  // English
  "the",
  "a",
  "an",
  "thee",
  // French
  "le",
  "la",
  "les",
  "un",
  "une",
  // German
  "der",
  "die",
  "das",
  "ein",
  "eine",
  // Spanish ("la" / "un" shared with French)
  "el",
  "los",
  "las",
  "una",
  // Italian ("la" / "le" / "un" / "una" shared)
  "il",
  "lo",
  "gli",
  "uno",
  // Dutch
  "de",
  "het",
  "een",
  // Portuguese ("a" shared with English)
  "o",
  "os",
  "uma",
] as const;

/** `^(article)\s+` over the lower-cased name. */
const ARTICLE_PATTERN = new RegExp(`^(?:${ARTICLES.join("|")})\\s+`);

/**
 * Sort key of a name with any leading article removed: "The Beatles" sorts
 * under B, "A Perfect Circle" under P, "Die Ärzte" under Ä, "Los Lobos"
 * under L.
 *
 * @param name - Display name.
 * @returns Lower-cased key without the article prefix.
 */
export const sortKeyWithoutArticle = (name: string): string =>
  name.trim().toLowerCase().replace(ARTICLE_PATTERN, "");
