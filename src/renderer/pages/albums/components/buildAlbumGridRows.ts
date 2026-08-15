import type { AlbumSummary } from "@mp/ipc";

/**
 * Virtualised row list of the album grid
 * (`docs/specs/v1.0/features/album-view.md`): card rows of `columns` albums.
 * The selected album's track list lives in the split pane below the grid, so
 * every row is a plain chunk of cards. Pure render-time derivation.
 *
 * @param albums - Sorted album summaries.
 * @param columns - Cards per row (≥ 1).
 * @returns Card rows in display order.
 */
export const buildAlbumGridRows = (
  albums: readonly AlbumSummary[],
  columns: number,
): (readonly AlbumSummary[])[] => {
  const rows: (readonly AlbumSummary[])[] = [];
  for (let start = 0; start < albums.length; start += columns) {
    rows.push(albums.slice(start, start + columns));
  }

  return rows;
};
