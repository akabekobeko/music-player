/**
 * Index math of the playlist track list (drag & drop reorder, row removal).
 * Position — not track id — is a playlist entry's identity, because the same
 * track may appear at several positions
 * (`docs/specs/v1.0/features/playlist.md`).
 */

/**
 * Move one item to another position, shifting the range between.
 *
 * @param list - Source list.
 * @param from - Index being dragged.
 * @param to - Index to insert at (position in the resulting list).
 * @returns A new list; the input when the indexes are equal or out of range.
 */
export const moveItem = <T>(
  list: readonly T[],
  from: number,
  to: number,
): T[] => {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return [...list];
  }

  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
};

/**
 * Remove the item at one position.
 *
 * @param list - Source list.
 * @param index - Position to remove.
 * @returns A new list without that position.
 */
export const removeAt = <T>(list: readonly T[], index: number): T[] =>
  list.filter((_, entryIndex) => entryIndex !== index);
