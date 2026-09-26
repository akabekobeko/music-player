/**
 * Normalise a title for comparison
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): ignore case,
 * surrounding whitespace and full-width / half-width differences (NFKC),
 * and collapse runs of whitespace.
 *
 * @param title - Raw title.
 * @returns The comparison key.
 */
export const normalizeTitle = (title: string): string =>
  title.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
