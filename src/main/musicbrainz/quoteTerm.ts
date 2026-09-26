import { escapeLucene } from "./escapeLucene";

/**
 * Wrap a tag value as a quoted, escaped Lucene phrase
 * (`"<escaped>"`), the form every field clause of the search queries uses
 * (`docs/specs/v1.2/architecture/search-query.md`).
 *
 * @param value - Raw tag text.
 * @returns The quoted phrase.
 */
export const quoteTerm = (value: string): string => `"${escapeLucene(value)}"`;
