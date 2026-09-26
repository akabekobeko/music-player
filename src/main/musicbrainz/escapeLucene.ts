/**
 * Lucene special characters
 * (https://musicbrainz.org/doc/MusicBrainz_API/Search). `&&` and `||` are
 * covered by escaping each `&` / `|`.
 */
const SPECIAL_CHARACTERS = /[+\-&|!(){}[\]^"~*?:\\/]/g;

/**
 * Escape a search term for the MusicBrainz (Lucene) query syntax
 * (`docs/specs/v1.2/architecture/search-query.md`).
 *
 * Only the syntax characters are escaped with a backslash; every other
 * character, including non-ASCII text and emoji, passes through unchanged.
 * URL encoding is a separate step performed by `URLSearchParams`.
 *
 * @param term - Raw tag text.
 * @returns The escaped term, ready to be wrapped in double quotes.
 */
export const escapeLucene = (term: string): string =>
  term.replace(SPECIAL_CHARACTERS, (character) => `\\${character}`);
