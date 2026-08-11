import type { AlbumSummary } from "@mp/ipc";

/**
 * Virtualised row list of the album grid
 * (`docs/specs/v1.0/features/album-view.md`): card rows of `columns` albums,
 * with the expanded album's detail panel inserted as its own full-width row
 * directly below the card row that contains it. Pure render-time derivation.
 */

/** One virtualised row of the album grid. */
export type AlbumGridRow =
  | { readonly type: "cards"; readonly albums: readonly AlbumSummary[] }
  | { readonly type: "detail"; readonly album: AlbumSummary };

/**
 * Chunk albums into card rows and splice in the expanded detail row.
 *
 * An `expandedKey` that no longer matches any album (e.g. the filter changed
 * while expanded) simply produces no detail row.
 *
 * @param albums - Sorted album summaries.
 * @param columns - Cards per row (≥ 1).
 * @param expandedKey - `albumKey` of the expanded album, or `null`.
 * @returns Rows in display order.
 */
export const buildAlbumGridRows = (
  albums: readonly AlbumSummary[],
  columns: number,
  expandedKey: string | null,
): AlbumGridRow[] => {
  const rows: AlbumGridRow[] = [];
  for (let start = 0; start < albums.length; start += columns) {
    const chunk = albums.slice(start, start + columns);
    rows.push({ type: "cards", albums: chunk });
    const expanded =
      expandedKey !== null
        ? chunk.find((album) => album.albumKey === expandedKey)
        : undefined;
    if (expanded !== undefined) {
      rows.push({ type: "detail", album: expanded });
    }
  }

  return rows;
};
