import type { ArtistListItem } from "./flattenSections";
import type { Initial } from "./initials";

/**
 * Heading pinned at the top of the list for a scroll position: the last
 * heading whose natural position is above the viewport top (like a
 * UITableView section header). Heading B takes over the moment its own row
 * scrolls under the top; scrolling back into A's rows hands it back to A.
 *
 * While a heading sits exactly at the top, nothing is pinned: the in-list
 * heading is fully visible there, so a pinned copy would only paint over it.
 * Painting over it matters because the copy is stacked above every row and
 * would cover the glow that the first row of the section casts up into the
 * heading (see `ArtistRow`), while the in-list heading is painted below a
 * lit row. This is the resting state at the top of the list and after
 * jumping to an initial, where such a squashed glow would be noticed.
 *
 * `starts` is ascending, so "the last heading already scrolled past" is the
 * same row a forward scan would stop before.
 *
 * @param items - Rows in display order.
 * @param starts - Row start offsets from `itemStartsOf`.
 * @param scrollTop - Current scroll offset in px.
 * @returns The pinned initial, or `null` when nothing needs pinning (no
 * heading, or a heading sits exactly at the top).
 */
export const activeInitialAt = (
  items: readonly ArtistListItem[],
  starts: readonly number[],
  scrollTop: number,
): Initial | null => {
  const index = items.findLastIndex(
    (item, i) => item.kind === "heading" && (starts[i] ?? 0) <= scrollTop,
  );
  const item = items[index];
  if (item === undefined || item.kind !== "heading") {
    return null;
  }

  return starts[index] === scrollTop ? null : item.initial;
};
