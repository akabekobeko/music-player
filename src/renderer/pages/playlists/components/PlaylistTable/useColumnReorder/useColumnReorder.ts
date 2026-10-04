import { type DragEvent, useState } from "react";
import type {
  ColumnDropSide,
  PlaylistColumn,
  PlaylistColumnId,
} from "@/features/playlistColumns/types";
import { type ColumnDrop, columnDropOf } from "./columnDropOf";

type Args = {
  /** Visible columns in display order. */
  readonly columns: readonly PlaylistColumn[];
  /** Persists the move; called once when the column is dropped. */
  readonly onColumnMove: (
    columnId: PlaylistColumnId,
    targetId: PlaylistColumnId,
    side: ColumnDropSide,
  ) => void;
};

/** A column drag in flight. */
type Drag = {
  /** Column being dragged. */
  readonly columnId: PlaylistColumnId;
  /** Where it would land; `null` while a drop would change nothing. */
  readonly drop: ColumnDrop | null;
};

/**
 * Column reorder by dragging a header
 * (`docs/specs/v1.3/features/column-reorder.md`), on the native drag and
 * drop like the rows' reorder.
 *
 * The drag in flight lives in this hook's state, held by the header that
 * shows it, so the rows do not re-render while a column is dragged; the
 * store only learns the move when the column is dropped. The landing place follows the pointer:
 * the half of the hovered header it is in picks the side. All of it happens
 * in event handlers, no effect is involved. The handlers ignore drags that
 * did not start on a header (a playlist row, a file from outside).
 *
 * @returns `draggingId` and `drop` for display, and `handlers`, the drag
 *   handlers for the header cells.
 */
export const useColumnReorder = ({ columns, onColumnMove }: Args) => {
  const [drag, setDrag] = useState<Drag | null>(null);

  /** Landing place for the pointer's position over a header cell. */
  const dropAt = (
    current: Drag,
    event: DragEvent<HTMLElement>,
    overId: PlaylistColumnId,
  ): ColumnDrop | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    return columnDropOf({
      columns,
      sourceId: current.columnId,
      overId,
      side: event.clientX < rect.left + rect.width / 2 ? "before" : "after",
    });
  };

  /** Start a drag on `dragstart` of a header's label. */
  const beginDrag = (
    event: DragEvent<HTMLElement>,
    columnId: PlaylistColumnId,
  ): void => {
    event.dataTransfer.effectAllowed = "move";
    setDrag({ columnId, drop: null });
  };

  /**
   * Follow the pointer on `dragover` of a header cell. The state is only
   * replaced when the landing place changes: `dragover` fires continuously.
   */
  const dragOver = (
    event: DragEvent<HTMLElement>,
    overId: PlaylistColumnId,
  ): void => {
    if (drag === null) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const drop = dropAt(drag, event, overId);
    // Compared with the latest state, not the rendered one: a `dragleave`
    // may have cleared the landing place since the last render.
    setDrag((current) =>
      current === null ||
      (current.drop?.targetId === drop?.targetId &&
        current.drop?.side === drop?.side)
        ? current
        : { ...current, drop },
    );
  };

  /**
   * Forget the landing place on `dragleave` of the header row, i.e. when
   * the pointer leaves it rather than moves between its cells.
   */
  const dragLeave = (event: DragEvent<HTMLElement>): void => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDrag((current) =>
      current === null || current.drop === null
        ? current
        : { ...current, drop: null },
    );
  };

  /** Commit on `drop` over a header cell. */
  const dropOn = (
    event: DragEvent<HTMLElement>,
    overId: PlaylistColumnId,
  ): void => {
    if (drag === null) {
      return;
    }

    event.preventDefault();
    const drop = dropAt(drag, event, overId);
    setDrag(null);
    if (drop !== null) {
      onColumnMove(drag.columnId, drop.targetId, drop.side);
    }
  };

  /** Clear the drag on `dragend`, with or without a drop. */
  const endDrag = (): void => {
    setDrag(null);
  };

  return {
    draggingId: drag?.columnId ?? null,
    drop: drag?.drop ?? null,
    handlers: { beginDrag, dragOver, dragLeave, dropOn, endDrag },
  };
};
