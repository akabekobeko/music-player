import type { Music } from "@mp/ipc";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { formatTime } from "@/libs/formatTime";
import { formatAddedDate } from "./formatAddedDate";

/** Columns whose cell is plain text derived from the track. */
type TextColumnId = Exclude<PlaylistColumnId, "ordinal" | "rating" | "menu">;

/**
 * Text of a plain-text cell (`docs/specs/v1.3/features/columns.md`). The
 * empty string means a blank cell: an unset text tag, an unknown year or
 * bpm (`null`), or an untagged track number (`0`). The disc number, the
 * format, the added date, and the duration always have a value.
 *
 * @param columnId - Column of the cell.
 * @param music - Track of the row.
 * @param locale - BCP 47 tag of the UI locale, used for the added date.
 * @returns The text to show; empty for a blank cell.
 */
export const playlistCellTextOf = (
  columnId: TextColumnId,
  music: Music,
  locale: string,
): string => {
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
    case "audioFormat":
      return music[columnId];
    case "year":
    case "bpm": {
      const value = music[columnId];
      return value === null ? "" : String(value);
    }
    case "track":
      return music.track === 0 ? "" : String(music.track);
    case "disc":
      return String(music.disc);
    case "addedAt":
      return formatAddedDate(music.addedAt, locale);
    case "duration":
      return formatTime(music.durationMs / 1000);
  }
};
