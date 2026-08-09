/**
 * Geometry of the album card grid (`docs/specs/v1.0/features/album-view.md`).
 *
 * The grid virtualises by row, so the row height must be known up front:
 * cards are artwork-square + a fixed-height text block, and the column count
 * follows the container width. Pure math — the page recomputes it whenever
 * the measured width changes.
 */

/** Horizontal and vertical gap between cards (px). */
export const GRID_GAP = 16;

/** Minimum card width (px); the column count derives from it. */
export const CARD_MIN_WIDTH = 160;

/** Text block under the artwork + the vertical row gap (px). */
export const CARD_META_HEIGHT = 76;

/** Resolved grid geometry for one container width. */
export type AlbumGridLayout = {
  readonly columns: number;
  /** Card (and artwork) width in px. */
  readonly cardWidth: number;
  /** Virtualised row height in px (artwork square + text block + gap). */
  readonly rowHeight: number;
};

/**
 * Compute the grid geometry for a container width.
 *
 * @param width - Content width of the scroll container in px (`0` before the
 *   first measurement — treated as a single minimum-width column).
 * @returns Columns, card width, and row height.
 */
export const computeAlbumGridLayout = (width: number): AlbumGridLayout => {
  const columns = Math.max(
    1,
    Math.floor((width + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)),
  );
  const cardWidth =
    width > 0
      ? Math.floor((width - GRID_GAP * (columns - 1)) / columns)
      : CARD_MIN_WIDTH;
  return { columns, cardWidth, rowHeight: cardWidth + CARD_META_HEIGHT };
};
