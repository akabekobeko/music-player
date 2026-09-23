import type { SelectionState } from "./applySelectionClick";

/**
 * Targets of a row's menu action ("Add to playlist", "Song info"): the whole
 * multi-selection in display order when the row is part of it, otherwise the
 * row alone (`docs/specs/v1.1/features/selection.md`).
 *
 * @param selection - The view's current selection.
 * @param ordered - Rows in display order.
 * @param idOf - The row's selection id (track id, or position).
 * @param target - The row whose menu was opened.
 * @returns The rows the action applies to; never empty.
 */
export const menuTargetsOf = <T>(
  selection: SelectionState,
  ordered: readonly T[],
  idOf: (row: T) => number,
  target: T,
): readonly T[] =>
  selection.selectedIds.has(idOf(target)) && selection.selectedIds.size > 1
    ? ordered.filter((row) => selection.selectedIds.has(idOf(row)))
    : [target];
