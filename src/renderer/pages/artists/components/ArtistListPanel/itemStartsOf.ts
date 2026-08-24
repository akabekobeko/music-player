import type { ArtistListItem } from "./flattenSections";
import { itemHeightOf } from "./itemHeightOf";

/**
 * Scroll offset at which every row starts (cumulative heights), used for the
 * initial scroll position and to decide which heading is pinned.
 *
 * @param items - Rows in display order.
 * @returns `starts[i]` = top offset of `items[i]` in px.
 */
export const itemStartsOf = (items: readonly ArtistListItem[]): number[] => {
  const starts: number[] = [];
  let offset = 0;
  for (const item of items) {
    starts.push(offset);
    offset += itemHeightOf(item);
  }

  return starts;
};
