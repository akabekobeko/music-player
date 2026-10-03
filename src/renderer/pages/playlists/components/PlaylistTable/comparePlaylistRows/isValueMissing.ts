import type { Music } from "@mp/ipc";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";

/**
 * Whether a track has no value in a column, which sorts its row last in
 * either direction (`docs/specs/v1.3/features/column-sort.md`). Matches the
 * condition for a blank cell: an unset text tag (empty string), an unknown
 * year, bpm, or rating (`null`; `0` is a value), or an untagged track
 * number (`0`). The other columns always have a value.
 *
 * @param columnId - Column the rows are sorted by.
 * @param music - Track of the row.
 * @returns `true` when the track has no value in the column.
 */
export const isValueMissing = (
  columnId: PlaylistColumnId,
  music: Music,
): boolean => {
  switch (columnId) {
    case "title":
    case "artist":
    case "album":
    case "albumArtist":
    case "genre":
    case "composer":
    case "lyricist":
    case "producer":
    case "conductor":
    case "publisher":
      return music[columnId] === "";
    case "year":
    case "bpm":
    case "rating":
      return music[columnId] === null;
    case "track":
      return music.track === 0;
    // Listed rather than left to a default, so a new column fails to
    // compile until it is given a rule here.
    case "ordinal":
    case "disc":
    case "audioFormat":
    case "addedAt":
    case "duration":
    case "menu":
      return false;
  }
};
