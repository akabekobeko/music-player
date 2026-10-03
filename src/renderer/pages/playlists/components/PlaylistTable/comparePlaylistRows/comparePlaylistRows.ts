import { compareNameWithoutArticle } from "@/features/library/compareNameWithoutArticle/compareNameWithoutArticle";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import type { PlaylistRow, PlaylistSort } from "../types";
import { isValueMissing } from "./isValueMissing";

/** Case-insensitive text order. */
const compareText = (a: string, b: string): number => {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  return lowerA < lowerB ? -1 : lowerA > lowerB ? 1 : 0;
};

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
      return compareNameWithoutArticle(a.music[columnId], b.music[columnId]);
    case "genre":
    case "composer":
    case "audioFormat":
      return compareText(a.music[columnId], b.music[columnId]);
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
      return a.music.addedAt < b.music.addedAt
        ? -1
        : a.music.addedAt > b.music.addedAt
          ? 1
          : 0;
    case "menu":
      return 0;
  }
};

/**
 * Comparator for the table's rows (`docs/specs/v1.3/features/column-sort.md`).
 *
 * - Names (title, artist, album, album artist) compare without the leading
 *   article and case-insensitively, like the Artists view; genre, composer,
 *   and format compare case-insensitively; the rest compare as numbers, and
 *   the added date by its full timestamp.
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
