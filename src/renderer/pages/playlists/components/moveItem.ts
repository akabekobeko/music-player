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
