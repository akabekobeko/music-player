import type { PlaylistColumnWidths } from "./types";

/**
 * Width the title column needs to fill the container: the container width
 * minus the widths of all other columns. Zero or negative when the other
 * columns alone fill the container. The single definition behind both the
 * displayed title width (`fitTitleWidth`) and the lower bound of a title
 * resize (`minResizeWidthOf`), which must agree.
 *
 * @param widths - Widths in px keyed by column id.
 * @param containerWidth - Width in px available to the table.
 * @returns The width in px that would make the columns fill the container.
 */
export const titleFillWidthOf = (
  widths: PlaylistColumnWidths,
  containerWidth: number,
): number => {
  const total = Object.values(widths).reduce((sum, width) => sum + width, 0);
  return containerWidth - (total - (widths.title ?? 0));
};
