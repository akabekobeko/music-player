import { MIN_COLUMN_WIDTH } from "./constants";
import { titleFillWidthOf } from "./titleFillWidthOf";
import type { PlaylistColumnId, PlaylistColumnWidths } from "./types";

/**
 * Smallest width a column can be dragged to
 * (`docs/specs/v1.3/features/column-resize.md`). Every column stops at
 * `MIN_COLUMN_WIDTH`. The title column also cannot go below the space the
 * other columns leave in the container: narrower than that it would be
 * widened back for display, so the drag would move the saved width without
 * any visible change.
 *
 * @param columnId - Column being resized.
 * @param widths - Displayed widths in px keyed by column id.
 * @param containerWidth - Width in px available to the table.
 * @returns The lower bound in px for the drag.
 */
export const minResizeWidthOf = (
  columnId: PlaylistColumnId,
  widths: PlaylistColumnWidths,
  containerWidth: number,
): number =>
  columnId === "title"
    ? Math.max(MIN_COLUMN_WIDTH, titleFillWidthOf(widths, containerWidth))
    : MIN_COLUMN_WIDTH;
