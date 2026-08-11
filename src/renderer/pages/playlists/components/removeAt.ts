/**
 * Index math of the playlist track list (drag & drop reorder, row removal).
 * Position — not track id — is a playlist entry's identity, because the same
 * track may appear at several positions
 * (`docs/specs/v1.0/features/playlist.md`).
 */

/**
 * Remove the item at one position.
 *
 * @param list - Source list.
 * @param index - Position to remove.
 * @returns A new list without that position.
 */
export const removeAt = <T>(list: readonly T[], index: number): T[] =>
  list.filter((_, entryIndex) => entryIndex !== index);
