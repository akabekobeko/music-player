import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import type { PlaylistSort } from "./types";

/**
 * Sort state after a click on a column header
 * (`docs/specs/v1.3/features/column-sort.md`): another column sorts
 * ascending, the sorted column flips its direction. There is no unsorted
 * state; a click on the ordinal header returns to the playlist order.
 *
 * @param sort - Current sort state.
 * @param columnId - Column whose header was clicked.
 * @returns The next sort state.
 */
export const nextPlaylistSort = (
  sort: PlaylistSort,
  columnId: PlaylistColumnId,
): PlaylistSort =>
  sort.columnId === columnId
    ? { columnId, order: sort.order === "asc" ? "desc" : "asc" }
    : { columnId, order: "asc" };
