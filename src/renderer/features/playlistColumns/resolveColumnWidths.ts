import { MIN_COLUMN_WIDTH } from "./constants";
import type { PlaylistColumn, PlaylistColumnWidths } from "./types";

/**
 * Resolve the width of each given column: the saved width raised to
 * `MIN_COLUMN_WIDTH`, or the column's default width when nothing usable is
 * saved (no entry, not a finite number, or below 1). Columns that cannot be
 * resized always take their default width, which may be below the minimum.
 *
 * @param columns - Columns to resolve, normally the visible ones.
 * @param widths - Persisted user-resized widths in px keyed by column id;
 *   `undefined` when nothing is saved yet.
 * @returns Widths in px keyed by the id of every given column.
 */
export const resolveColumnWidths = (
  columns: readonly PlaylistColumn[],
  widths: Readonly<Record<string, number>> | undefined,
): PlaylistColumnWidths =>
  Object.fromEntries(
    columns.map((column) => {
      const saved = column.resizable ? widths?.[column.id] : undefined;
      return [
        column.id,
        saved !== undefined && Number.isFinite(saved) && saved >= 1
          ? Math.max(saved, MIN_COLUMN_WIDTH)
          : column.width,
      ];
    }),
  );
