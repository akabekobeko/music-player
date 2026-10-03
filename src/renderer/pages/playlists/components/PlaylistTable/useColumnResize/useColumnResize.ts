import { type PointerEvent, useState } from "react";
import type {
  PlaylistColumnId,
  PlaylistColumnWidths,
} from "@/features/playlistColumns/types";
import { resizedWidthOf } from "./resizedWidthOf";

type Args = {
  /** Resolved widths in px keyed by column id. */
  readonly baseWidths: PlaylistColumnWidths;
  /** Persists the final width; called once when the drag ends. */
  readonly onColumnResize: (columnId: PlaylistColumnId, width: number) => void;
};

/** A resize drag in flight. */
type Drag = {
  /** Column being resized. */
  readonly columnId: PlaylistColumnId;
  /** Pointer `clientX` in px when the drag started. */
  readonly startX: number;
  /** Displayed width in px when the drag started. */
  readonly startWidth: number;
  /** Lower bound in px for this drag. */
  readonly minWidth: number;
  /** Current width in px, not rounded. */
  readonly width: number;
};

/**
 * Column resize by dragging a header's handle
 * (`docs/specs/v1.3/features/column-resize.md`).
 *
 * The width in flight lives in this hook's state and overrides
 * `baseWidths` in `liveWidths`; the store only learns the final width when
 * the drag ends. The handle captures the pointer on `pointerdown`, so the
 * same element receives the move / up / cancel events wherever the pointer
 * goes; they are plain event handlers, no effect is involved.
 *
 * @returns `liveWidths` for display, and `handlers`, the pointer handlers
 *   for the resize handles.
 */
export const useColumnResize = ({ baseWidths, onColumnResize }: Args) => {
  const [drag, setDrag] = useState<Drag | null>(null);

  const liveWidths: PlaylistColumnWidths =
    drag === null ? baseWidths : { ...baseWidths, [drag.columnId]: drag.width };

  /** Width for the pointer's current position in the drag. */
  const widthAt = (current: Drag, event: PointerEvent<HTMLElement>): number =>
    resizedWidthOf(
      current.startWidth,
      event.clientX - current.startX,
      current.minWidth,
    );

  /**
   * Start a drag on `pointerdown` of a handle. The caller passes the start
   * width and the lower bound because it knows the displayed widths (the
   * title column may be wider than its resolved width).
   */
  const beginResize = (
    event: PointerEvent<HTMLElement>,
    columnId: PlaylistColumnId,
    startWidth: number,
    minWidth: number,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      columnId,
      startX: event.clientX,
      startWidth,
      minWidth,
      width: startWidth,
    });
  };

  /** Follow the pointer on `pointermove` of the capturing handle. */
  const moveResize = (event: PointerEvent<HTMLElement>): void => {
    if (drag !== null) {
      setDrag({ ...drag, width: widthAt(drag, event) });
    }
  };

  /**
   * Commit on `pointerup`: the rounded width is persisted unless the
   * pointer ended where it started (a plain click).
   */
  const endResize = (event: PointerEvent<HTMLElement>): void => {
    if (drag === null) {
      return;
    }

    const width = widthAt(drag, event);
    setDrag(null);
    if (width !== drag.startWidth) {
      onColumnResize(drag.columnId, Math.round(width));
    }
  };

  /**
   * Abandon the drag on `pointercancel` or when the handle loses the
   * pointer capture without a `pointerup`; nothing is persisted. After a
   * regular `pointerup` the capture is released too, by which time the drag
   * is already over.
   */
  const cancelResize = (): void => {
    setDrag(null);
  };

  return {
    liveWidths,
    handlers: { beginResize, moveResize, endResize, cancelResize },
  };
};

/** Pointer handlers of `useColumnResize`, for the resize handles. */
export type ColumnResizeHandlers = ReturnType<
  typeof useColumnResize
>["handlers"];
