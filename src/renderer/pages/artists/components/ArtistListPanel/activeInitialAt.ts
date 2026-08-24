import type { ArtistListItem } from "./flattenSections";
import type { Initial } from "./initials";

/**
 * Heading pinned at the top of the list for a scroll position: the last
 * heading whose natural position is at or above the viewport top (like a
 * UITableView section header). Heading B takes over the moment its own row
 * reaches the top; scrolling back into A's rows hands it back to A.
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
): Initial | null => {
  let active: Initial | null = null;
  for (const [index, item] of items.entries()) {
    if (item.kind !== "heading") {
      continue;
    }

    if ((starts[index] ?? 0) > scrollTop) {
      break;
    }

    active = item.initial;
  }

  return active;
};
