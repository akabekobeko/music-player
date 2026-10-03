import { MIN_COLUMN_WIDTH } from "./constants";
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
): number => {
  if (columnId !== "title") {
    return MIN_COLUMN_WIDTH;
  }

  const total = Object.values(widths).reduce((sum, width) => sum + width, 0);
  const others = total - (widths.title ?? 0);
  return Math.max(MIN_COLUMN_WIDTH, containerWidth - others);
};
