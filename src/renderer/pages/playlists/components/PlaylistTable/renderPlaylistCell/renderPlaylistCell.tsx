import type { Music } from "@mp/ipc";
import type { ReactNode } from "react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { cn } from "@/libs/utils";
import { playlistCellTextOf } from "./playlistCellTextOf";
import { RatingStars } from "./RatingStars";
import { ratingStarsOf } from "./ratingStarsOf";

/**
 * Extra classes of the columns shown with tabular digits: numbers and the
 * duration are monospaced like the v1.2 duration, the added date keeps the
 * UI font.
 */
const DIGIT_CLASS_NAMES: Partial<Record<PlaylistColumnId, string>> = {
  year: "font-mono tabular-nums",
  track: "font-mono tabular-nums",
  disc: "font-mono tabular-nums",
  bpm: "font-mono tabular-nums",
  addedAt: "tabular-nums",
  duration: "font-mono tabular-nums",
};

type Args = {
  /** Column of the cell. */
  readonly columnId: PlaylistColumnId;
  /** Track of the row. */
  readonly music: Music;
  /**
   * Whether the row is the current track (playing or paused); emphasises
   * the title.
   */
  readonly current: boolean;
  /** BCP 47 tag of the UI locale, used for the added date. */
  readonly locale: string;
};

/**
 * Content of one table cell, picked by the column id
 * (`docs/specs/v1.3/features/columns.md`). Texts are clipped with an
 * ellipsis and show the full value in a tooltip; every column but the title
 * is muted and small like the v1.2 artist / album columns, and numbers,
 * durations, and dates use tabular digits.
 *
 * @returns The cell content; `null` for a blank cell and for the `ordinal`
 *   and `menu` columns, whose controls the row component renders itself.
 */
export const renderPlaylistCell = ({
  columnId,
  music,
  current,
  locale,
}: Args): ReactNode => {
  switch (columnId) {
    case "ordinal":
    case "menu":
      return null;
    case "title":
      return (
        <EllipsisText
          className={cn(current && "font-medium text-primary")}
          text={music.title}
        />
      );
    case "rating":
      return music.rating === null ? null : (
        <RatingStars stars={ratingStarsOf(music.rating)} />
      );
    default: {
      const text = playlistCellTextOf(columnId, music, locale);
      return text === "" ? null : (
        <EllipsisText
          className={cn(
            "text-muted-foreground text-xs",
            DIGIT_CLASS_NAMES[columnId],
          )}
          text={text}
        />
      );
    }
  }
};
