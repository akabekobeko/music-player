import { sortKeyWithoutArticle } from "@/features/library/compareNameWithoutArticle/sortKeyWithoutArticle";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import type { PlaylistRow, PlaylistSort } from "../types";
import { isValueMissing } from "./isValueMissing";

/** Order of two sort keys by code unit. */
const compareKeys = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

/**
 * Ascending order of two rows by a column's value. Rows without a value
 * never get here, so the `null` fallbacks are only for the types.
 */
const compareValues = (
  columnId: PlaylistColumnId,
  a: PlaylistRow,
  b: PlaylistRow,
): number => {
  switch (columnId) {
    case "ordinal":
      return a.index - b.index;
    case "title":
    case "artist":
    case "album":
    case "albumArtist":
      // The key alone, without the raw-name tiebreak of
      // `compareNameWithoutArticle`: names that differ only in case or in
      // the article are equal here and keep the playlist order.
      return compareKeys(
        sortKeyWithoutArticle(a.music[columnId]),
        sortKeyWithoutArticle(b.music[columnId]),
      );
    case "genre":
    case "composer":
    case "audioFormat":
      return compareKeys(
        a.music[columnId].toLowerCase(),
        b.music[columnId].toLowerCase(),
      );
    case "year":
    case "bpm":
    case "rating":
      return (a.music[columnId] ?? 0) - (b.music[columnId] ?? 0);
    case "track":
    case "disc":
      return a.music[columnId] - b.music[columnId];
    case "duration":
      return a.music.durationMs - b.music.durationMs;
    case "addedAt":
      // ISO-8601 strings order like the instants they denote.
      return compareKeys(a.music.addedAt, b.music.addedAt);
    case "menu":
      return 0;
  }
};

/**
 * Comparator for the table's rows (`docs/specs/v1.3/features/column-sort.md`).
 *
 * - Names (title, artist, album, album artist) compare without the leading
 *   article and case-insensitively, by the Artists view's sort key; genre,
 *   composer, and format compare case-insensitively; the rest compare as
 *   numbers, and the added date by its full timestamp.
 * - Rows without a value (`isValueMissing`) go last in either direction.
 * - Equal rows keep the playlist order, also when descending.
 *
 * @param sort - Sort key and direction.
 * @returns A comparator for `Array.prototype.toSorted`.
 */
export const comparePlaylistRows =
  (sort: PlaylistSort) =>
  (a: PlaylistRow, b: PlaylistRow): number => {
    const missingA = isValueMissing(sort.columnId, a.music);
    const missingB = isValueMissing(sort.columnId, b.music);
    if (missingA !== missingB) {
      return missingA ? 1 : -1;
    }

    const result = missingA ? 0 : compareValues(sort.columnId, a, b);
    if (result === 0) {
      return a.index - b.index;
    }

    return sort.order === "asc" ? result : -result;
  };
