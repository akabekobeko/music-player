import type { PointerEvent } from "react";

type Props = {
  /** Starts the drag; the handle captures the pointer here. */
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  /** Follows the pointer while the handle holds the capture. */
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  /** Commits the dragged width. */
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  /** Abandons the drag. */
  readonly onPointerCancel: () => void;
  /** Returns the column to its default width. */
  readonly onDoubleClick: () => void;
};

/**
 * Resize handle on the right edge of a header cell
 * (`docs/specs/v1.3/features/column-resize.md`): a 6px strip that shows the
 * `col-resize` cursor and lights up on hover and while dragged. It sits
 * above the header's sort button without being part of it, so dragging or
 * double-clicking it never sorts. Resizing is pointer-only, so the handle
 * is hidden from assistive technology.
 */
export const ColumnResizeHandle = ({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
}: Props) => (
  <span
    aria-hidden
    className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/60 active:bg-primary"
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerCancel}
    onDoubleClick={onDoubleClick}
  />
);
