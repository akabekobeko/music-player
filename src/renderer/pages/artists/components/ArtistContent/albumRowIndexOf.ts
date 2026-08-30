import type { AlbumRow } from "./buildAlbumRows";

/**
 * Index of an album's heading row in the flat row stream (`buildAlbumRows`),
 * or `-1` when the album is not listed (e.g. hidden by the song filter).
 *
 * @param rows - Rows in display order.
 * @param albumKey - `AlbumGroup.key` of the album to locate.
 */
export const albumRowIndexOf = (
  rows: readonly AlbumRow[],
  albumKey: string,
): number =>
  rows.findIndex((row) => row.type === "album" && row.group.key === albumKey);
