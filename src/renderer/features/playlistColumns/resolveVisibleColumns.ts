import type { PlaylistColumn } from "./types";

/**
 * Pick the columns the table shows, in display order
 * (`docs/specs/v1.3/features/column-reorder.md`): the pinned columns
 * declared before the optional ones, the optional columns in the order of
 * `visibleIds`, then the remaining pinned columns. Ids that name no column,
 * name a pinned one, or repeat are dropped.
 *
 * @param columns - Column definitions in declaration order.
 * @param visibleIds - Persisted ids of the optional columns to show, in
 *   display order; `undefined` (nothing saved yet) shows each column's
 *   `defaultVisible` in declaration order.
 * @returns The visible column definitions in display order.
 */
export const resolveVisibleColumns = (
  columns: readonly PlaylistColumn[],
  visibleIds: readonly string[] | undefined,
): readonly PlaylistColumn[] => {
  if (visibleIds === undefined) {
    return columns.filter((column) => column.pinned || column.defaultVisible);
  }

  const firstOptional = columns.findIndex((column) => !column.pinned);
  if (firstOptional === -1) {
    return columns;
  }

  const optional = [...new Set(visibleIds)].flatMap((id) => {
    const column = columns.find((entry) => entry.id === id);
    return column === undefined || column.pinned ? [] : [column];
  });
  return [
    ...columns.slice(0, firstOptional),
    ...optional,
    ...columns.slice(firstOptional).filter((column) => column.pinned),
  ];
};
