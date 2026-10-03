/**
 * Width of a column while its resize handle is dragged: the width at the
 * start of the drag plus the pointer's horizontal travel, kept at or above
 * the lower bound.
 *
 * @param startWidth - Displayed width in px when the drag started.
 * @param delta - Horizontal pointer travel in px since the drag started;
 *   negative to the left.
 * @param minWidth - Lower bound in px.
 * @returns The width in px, not rounded.
 */
export const resizedWidthOf = (
  startWidth: number,
  delta: number,
  minWidth: number,
): number => Math.max(minWidth, startWidth + delta);
