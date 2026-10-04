import type { ColumnDropSide } from "./types";

type Args = {
  /** Column ids in display order. */
  readonly ids: readonly string[];
  /** Column being moved. */
  readonly sourceId: string;
  /** Column the source is dropped on. */
  readonly targetId: string;
  /** Side of the target the source lands on. */
  readonly side: ColumnDropSide;
};

/**
 * Move a column id next to another one
 * (`docs/specs/v1.3/features/column-reorder.md`): the source is lifted out
 * of the list and inserted before or after the target.
 *
 * @returns The reordered list; the same array when nothing changes (the
 *   source is the target, either id is not listed, or the source already
 *   sits there), so callers can skip the save.
 */
export const reorderColumnIds = ({
  ids,
  sourceId,
  targetId,
  side,
}: Args): readonly string[] => {
  if (sourceId === targetId || !ids.includes(sourceId)) {
    return ids;
  }

  const rest = ids.filter((id) => id !== sourceId);
  const targetIndex = rest.indexOf(targetId);
  if (targetIndex === -1) {
    return ids;
  }

  const insertAt = side === "before" ? targetIndex : targetIndex + 1;
  const next = rest.toSpliced(insertAt, 0, sourceId);
  return next.length === ids.length &&
    next.every((id, index) => id === ids[index])
    ? ids
    : next;
};
