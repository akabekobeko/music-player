import type { ArtistCredit } from "../schemas/artistCreditSchema";

/**
 * Join an artist credit into the single string the tag holds
 * (`docs/specs/v1.2/architecture/metadata-mapping.md`): each credited name
 * followed by its join phrase, e.g. `Artist X feat. Artist Y`.
 *
 * @param credit - The credit list, or `undefined` when the entity has none.
 * @returns The joined name, or `null` when the credit is absent or empty.
 */
export const joinArtistCredit = (
  credit: ArtistCredit | undefined,
): string | null => {
  if (credit === undefined || credit.length === 0) {
    return null;
  }

  const joined = credit
    .map((entry) => `${entry.name}${entry.joinphrase ?? ""}`)
    .join("")
    .trim();
  return joined === "" ? null : joined;
};
