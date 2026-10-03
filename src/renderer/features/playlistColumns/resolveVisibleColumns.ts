import type { PlaylistColumn } from "./types";

/**
 * Pick the columns the table shows: the pinned columns plus the optional
 * ones listed in `visibleIds`, in declaration order. The order of
 * `visibleIds` is not significant, and ids that name no column are dropped.
 *
 * @param columns - Column definitions in declaration order.
 * @param visibleIds - Persisted ids of the optional columns to show;
 *   `undefined` (nothing saved yet) shows each column's `defaultVisible`.
 * @returns The visible column definitions in declaration order.
 */
export const resolveVisibleColumns = (
  columns: readonly PlaylistColumn[],
  visibleIds: readonly string[] | undefined,
): readonly PlaylistColumn[] =>
  columns.filter(
    (column) =>
      column.pinned ||
      (visibleIds === undefined
        ? column.defaultVisible
        : visibleIds.includes(column.id)),
  );
