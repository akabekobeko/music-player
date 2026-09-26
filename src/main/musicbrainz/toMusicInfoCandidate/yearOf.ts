import type { Release } from "../schemas/releaseSchema";

const LEADING_YEAR = /^(\d{4})/;

/**
 * Read the release year (`docs/specs/v1.2/architecture/metadata-mapping.md`):
 * the first four digits of `date`, falling back to the release group's
 * `first-release-date`. Both are `YYYY-MM-DD`, `YYYY-MM` or `YYYY`.
 *
 * @param release - The looked-up release.
 * @returns The year, or `null` when neither date is known.
 */
export const yearOf = (release: Release): number | null => {
  for (const date of [
    release.date,
    release["release-group"]?.["first-release-date"],
  ]) {
    const match = date === undefined ? null : LEADING_YEAR.exec(date);
    if (match?.[1] !== undefined) {
      return Number(match[1]);
    }
  }

  return null;
};
