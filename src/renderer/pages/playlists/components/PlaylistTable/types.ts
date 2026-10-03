import type { Music } from "@mp/ipc";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";

/** One row of the table: the track and its position in the playlist. */
export type PlaylistRow = {
  /** The track at this row. */
  readonly music: Music;
  /**
   * 0-based position in the playlist order, before filtering and sorting
   * (shown 1-based as the ordinal). Identifies the row for the selection
   * and for mutations of the playlist.
   */
  readonly index: number;
};

/** Sort key and direction of the table (`docs/specs/v1.3/features/column-sort.md`). */
export type PlaylistSort = {
  /** Column the rows are sorted by. `ordinal` is the playlist order. */
  readonly columnId: PlaylistColumnId;
  /** Sort direction. */
  readonly order: "asc" | "desc";
};

/** The playlist order; the state every playlist opens with. */
export const DEFAULT_PLAYLIST_SORT: PlaylistSort = {
  columnId: "ordinal",
  order: "asc",
};
