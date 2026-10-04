import { reorderColumnIds } from "@/features/playlistColumns/reorderColumnIds";
import type {
  ColumnDropSide,
  PlaylistColumn,
  PlaylistColumnId,
} from "@/features/playlistColumns/types";

/** Where a dragged column lands: next to which column, on which side. */
export type ColumnDrop = {
  /** Optional column the dragged one is inserted next to. */
  readonly targetId: PlaylistColumnId;
  /** Side of the target it lands on. */
  readonly side: ColumnDropSide;
};

type Args = {
  /** Visible columns in display order. */
  readonly columns: readonly PlaylistColumn[];
  /** Column being dragged. */
  readonly sourceId: PlaylistColumnId;
  /** Column under the pointer. */
  readonly overId: PlaylistColumnId;
  /** Half of the hovered column the pointer is in. */
  readonly side: ColumnDropSide;
};

/**
 * Resolve where a dragged column would land
 * (`docs/specs/v1.3/features/column-reorder.md`).
 *
 * The pinned columns keep their place, so hovering one means the nearest
 * end of the optional columns: before the first for the leading pinned
 * columns, after the last for the trailing one.
 *
 * @returns The landing place, or `null` when the drop would change nothing
 *   (the column is dropped where it already is).
 */
export const columnDropOf = ({
  columns,
  sourceId,
  overId,
  side,
}: Args): ColumnDrop | null => {
  const optional = columns.filter((column) => !column.pinned);
  const first = optional.at(0);
  const last = optional.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }

  const over = columns.findIndex((column) => column.id === overId);
  const drop: ColumnDrop =
    columns[over]?.pinned === true
      ? over < columns.indexOf(first)
        ? { targetId: first.id, side: "before" }
        : { targetId: last.id, side: "after" }
      : { targetId: overId, side };
  const ids = optional.map((column) => column.id);
  return reorderColumnIds({ ids, sourceId, ...drop }) === ids ? null : drop;
};
