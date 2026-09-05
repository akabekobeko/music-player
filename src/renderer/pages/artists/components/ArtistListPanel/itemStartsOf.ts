import type { ArtistListItem } from "./flattenSections";
import { itemHeightOf } from "./itemHeightOf";

/**
 * Scroll offset at which every row starts (cumulative heights), used for the
 * initial scroll position and to decide which heading is pinned.
 *
 * Folds the heights into a running prefix sum seeded with `0`: the seed is
 * the first row's start, and the trailing entry (the total list height) is
 * dropped so the result lines up one-to-one with `items`.
 *
 * @param items - Rows in display order.
 * @returns `starts[i]` = top offset of `items[i]` in px.
 */
export const itemStartsOf = (items: readonly ArtistListItem[]): number[] =>
  items
    .reduce<number[]>(
      (starts, item, index) => {
        starts.push((starts[index] ?? 0) + itemHeightOf(item));
        return starts;
      },
      [0],
    )
    .slice(0, -1);
