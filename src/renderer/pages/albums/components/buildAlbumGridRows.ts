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
): (readonly AlbumSummary[])[] =>
  Array.from({ length: Math.ceil(albums.length / columns) }, (_, row) =>
    albums.slice(row * columns, (row + 1) * columns),
  );
