import type { ArtistListItem } from "./flattenSections";
import type { Initial } from "./initials";

/** Narrowed row type of a section heading. */
type HeadingItem = Extract<ArtistListItem, { readonly kind: "heading" }>;

/**
 * Heading pinned at the top of the list for a scroll position: the last
 * heading whose natural position is at or above the viewport top (like a
 * UITableView section header). Heading B takes over the moment its own row
 * reaches the top; scrolling back into A's rows hands it back to A.
 *
 * `starts` is ascending, so "the last heading already scrolled past" is the
 * same row a forward scan would stop before.
 *
 * @param items - Rows in display order.
 * @param starts - Row start offsets from `itemStartsOf`.
 * @param scrollTop - Current scroll offset in px.
 * @returns The pinned initial, or `null` when the list has no heading.
 */
export const activeInitialAt = (
  items: readonly ArtistListItem[],
  starts: readonly number[],
  scrollTop: number,
): Initial | null =>
  items.findLast(
    (item, index): item is HeadingItem =>
      item.kind === "heading" && (starts[index] ?? 0) <= scrollTop,
  )?.initial ?? null;
