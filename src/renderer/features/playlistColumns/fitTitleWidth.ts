import { titleFillWidthOf } from "./titleFillWidthOf";
import type { PlaylistColumnWidths } from "./types";

/**
 * Let the title column take up the space the other columns leave, so a wide
 * container shows no blank area on the right
 * (`docs/specs/v1.3/features/column-resize.md`):
 * `title = max(title, containerWidth - sum of the other widths)`. When the
 * columns already fill the container, every width stays as given and the
 * table scrolls horizontally.
 *
 * @param widths - Widths in px keyed by column id.
 * @param containerWidth - Width in px available to the table; `0` before
 *   the first measurement, which leaves the widths as given.
 * @returns The widths to display, with the title column widened as needed.
 */
export const fitTitleWidth = (
  widths: PlaylistColumnWidths,
  containerWidth: number,
): PlaylistColumnWidths => {
  const title = widths.title ?? 0;
  const fitted = Math.max(title, titleFillWidthOf(widths, containerWidth));
  return fitted === title ? widths : { ...widths, title: fitted };
};
