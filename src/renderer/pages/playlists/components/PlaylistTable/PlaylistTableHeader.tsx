import { ChevronDown, ChevronUp } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import type {
  PlaylistColumn,
  PlaylistColumnId,
} from "@/features/playlistColumns/types";
import { cn } from "@/libs/utils";
import { ColumnResizeHandle } from "./ColumnResizeHandle";
import {
  PLAYLIST_TABLE_HEADER_HEIGHT,
  PLAYLIST_TABLE_MENU_STICKY_RIGHT,
  PLAYLIST_TABLE_PADDING_X,
} from "./constants";
import type { PlaylistSort } from "./types";
import type { ColumnResizeHandlers } from "./useColumnResize/useColumnResize";

type Props = {
  /** Visible columns in display order. */
  readonly columns: readonly PlaylistColumn[];
  /** Displayed width in px of a column; shared with the body cells. */
  readonly widthOf: (columnId: PlaylistColumnId) => number;
  /** Sort state; the sorted column shows the direction arrow. */
  readonly sort: PlaylistSort;
  /** A sortable column's header was clicked. */
  readonly onSort: (columnId: PlaylistColumnId) => void;
  /** Pointer handlers of the resize drag, attached to every handle. */
  readonly resize: ColumnResizeHandlers;
  /** Lower bound in px for a resize drag of a column. */
  readonly minWidthOf: (columnId: PlaylistColumnId) => number;
  /** Returns a column to its default width (handle double-click). */
  readonly onResetWidth: (columnId: PlaylistColumnId) => void;
};

/**
 * Header row of the Playlist table, fixed to the top of the scroll
 * container. The opaque background hides the rows scrolling beneath, and
 * the header stacks above the playing row so its glow never bleeds into the
 * header. The glow also reaches into the scroll container's horizontal
 * padding, outside the header's box, so two unblurred shadows in the
 * background colour extend the cover over the padding on both sides.
 *
 * A sortable column's label is a button (plain text otherwise): a click
 * sorts by the column or
 * flips the direction (`docs/specs/v1.3/features/column-sort.md`), and the
 * sorted column shows an arrow and `aria-sort`. A resizable column has a
 * drag handle on its right edge
 * (`docs/specs/v1.3/features/column-resize.md`); the drag starts from the
 * displayed width, which this header knows through `widthOf`.
 *
 * The menu column's header is fixed to the right edge like its cells, and
 * opaque so the labels passing beneath do not show through
 * (`docs/specs/v1.3/architecture/table-structure.md`).
 */
export const PlaylistTableHeader = ({
  columns,
  widthOf,
  sort,
  onSort,
  resize,
  minWidthOf,
  onResetWidth,
}: Props) => {
  const t = useT();
  return (
    <thead
      // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
      role="rowgroup"
      className="sticky top-0 z-[2] block border-b bg-background"
      style={{
        height: PLAYLIST_TABLE_HEADER_HEIGHT,
        boxShadow: `${PLAYLIST_TABLE_PADDING_X}px 0 var(--background), -${PLAYLIST_TABLE_PADDING_X}px 0 var(--background)`,
      }}
    >
      <tr
        // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
        role="row"
        className="flex h-full"
      >
        {columns.map((column) => {
          const sorted = sort.columnId === column.id;
          const fixed = column.id === "menu";
          return (
            <th
              key={column.id}
              // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
              role="columnheader"
              scope="col"
              aria-sort={
                sorted
                  ? sort.order === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
              className={cn(
                "flex shrink-0 font-medium text-muted-foreground text-xs",
                fixed ? "sticky bg-background" : "relative",
              )}
              style={{
                width: widthOf(column.id),
                right: fixed ? PLAYLIST_TABLE_MENU_STICKY_RIGHT : undefined,
              }}
            >
              {column.labelKey === null ? null : column.sortable ? (
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 cursor-default items-center gap-1 rounded-sm px-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                    column.align === "end" ? "justify-end" : "justify-start",
                    sorted && "text-foreground",
                  )}
                  onClick={() => onSort(column.id)}
                >
                  <span className="truncate">{t(column.labelKey)}</span>
                  {sorted &&
                    (sort.order === "asc" ? (
                      <ChevronUp aria-hidden className="size-3 shrink-0" />
                    ) : (
                      <ChevronDown aria-hidden className="size-3 shrink-0" />
                    ))}
                </button>
              ) : (
                <span
                  className={cn(
                    "min-w-0 flex-1 self-center truncate px-2",
                    column.align === "end" ? "text-end" : "text-start",
                  )}
                >
                  {t(column.labelKey)}
                </span>
              )}
              {column.resizable && (
                <ColumnResizeHandle
                  onPointerDown={(event) =>
                    resize.beginResize(
                      event,
                      column.id,
                      widthOf(column.id),
                      minWidthOf(column.id),
                    )
                  }
                  onPointerMove={resize.moveResize}
                  onPointerUp={resize.endResize}
                  onPointerCancel={resize.cancelResize}
                  onDoubleClick={() => onResetWidth(column.id)}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};
