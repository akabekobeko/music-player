import type { Music } from "@mp/ipc";
import type { DragEvent, MouseEvent } from "react";
import { PausedButton } from "@/components/app/MusicRow/PausedButton";
import { PlayingButton } from "@/components/app/MusicRow/PlayingButton";
import { TrackNumberButton } from "@/components/app/MusicRow/TrackNumberButton";
import { RowMenu, type RowMenuItems } from "@/components/app/RowMenu/RowMenu";
import { RowMenuEntries } from "@/components/app/RowMenu/RowMenuItems";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { RowPlayingState } from "@/features/player/rowPlayingStateOf";
import type {
  PlaylistColumn,
  PlaylistColumnId,
} from "@/features/playlistColumns/types";
import { cn } from "@/libs/utils";
import { renderPlaylistCell } from "./renderPlaylistCell/renderPlaylistCell";

type Props = {
  /** Visible columns in display order. */
  readonly columns: readonly PlaylistColumn[];
  /** Displayed width in px of a column; shared with the header cells. */
  readonly widthOf: (columnId: PlaylistColumnId) => number;
  /** The track this row shows. */
  readonly music: Music;
  /**
   * 1-based position in the playlist order, shown in the leading cell. Stays
   * the same when the list is filtered.
   */
  readonly ordinal: number;
  /** Vertical offset in px from the top of the table body. */
  readonly offset: number;
  /** BCP 47 tag of the UI locale, used for the added date. */
  readonly locale: string;
  /** Non-null when this is the current track ("playing" / "paused"). */
  readonly playing: RowPlayingState;
  /** Whether the row is part of the multi-selection. */
  readonly selected: boolean;
  /** Whether the row can be dragged to reorder the playlist. */
  readonly draggable: boolean;
  /**
   * Whether a dragged row would be inserted before this row; shows the
   * insertion line at the row's top edge.
   */
  readonly dropTarget: boolean;
  /**
   * Selection handler for a click anywhere on the row but its controls
   * (Shift / Cmd / Ctrl arrive via the event).
   */
  readonly onSelect: (event: MouseEvent<HTMLTableRowElement>) => void;
  /** Start playback from this track (hover play button / double-click). */
  readonly onPlay: () => void;
  /**
   * Toggle play / pause of the current track (the current row's hover
   * pause / play button; the play button resumes from the paused position,
   * unlike `onPlay`).
   */
  readonly onTogglePlayPause: () => void;
  /** A drag of this row started. */
  readonly onDragStart: () => void;
  /** A dragged row moved over this row. */
  readonly onDragOver: () => void;
  /** A dragged row was dropped on this row. */
  readonly onDrop: () => void;
  /** The drag ended, with or without a drop. */
  readonly onDragEnd: () => void;
  /**
   * Per-track menu entries, shown by the [...] dropdown and by the row's
   * right-click menu alike.
   */
  readonly menuItems: RowMenuItems;
};

/**
 * Whether a mouse event belongs to the row itself. Events from the buttons
 * of the control cells (the leading cell's play / pause button and the
 * [...] button) are excluded, as are events bubbling through React from the
 * [...] dropdown, whose popup is portalled out of the row's DOM. Opening
 * the menu or selecting one of its entries thus never resets the
 * multi-selection, while the space around the buttons still counts as the
 * row.
 */
const isRowEvent = (event: MouseEvent<HTMLTableRowElement>): boolean =>
  event.target instanceof Element &&
  event.currentTarget.contains(event.target) &&
  event.target.closest("[data-row-control] button") === null;

/**
 * Classes for the row, carried over from `MusicRow`. The hovered and the
 * selected row show the rounded accent rectangle, as does the row whose
 * right-click menu is open (`data-popup-open`, set by the context-menu
 * trigger). The playing / paused row lights a 1px outline up with a blurred
 * glow and rises above its neighbours so their backgrounds never cover the
 * glow (the transformed rows are stacking contexts). The outline is an
 * inset shadow rather than a border: a border would take 2px off the cells
 * and misalign them with the header. Contiguous selected rows merge into
 * one rounded rectangle (`selected-above` / `selected-below` in `App.css`
 * look at the sibling row). A drop target draws the insertion line at its
 * top edge with a pseudo element, so the line takes no space either. Text
 * is unselectable so Shift-clicks and drags never start a text selection.
 */
const rowClassName = (
  playing: boolean,
  selected: boolean,
  dropTarget: boolean,
): string =>
  cn(
    "group absolute top-0 left-0 flex h-9 w-full cursor-default select-none items-center rounded-md text-sm transition-shadow duration-200",
    selected
      ? "bg-accent text-accent-foreground selected-above:rounded-t-none selected-below:rounded-b-none"
      : "hover:bg-accent/50 data-popup-open:bg-accent/50",
    playing &&
      "z-[1] shadow-[inset_0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    dropTarget &&
      "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary",
  );

/**
 * One row of the Playlist table
 * (`docs/specs/v1.3/features/playlist-table.md`), the table counterpart of
 * `MusicRow` with the same operations and look.
 *
 * The whole row is the click target: a click selects (Shift for a range,
 * Cmd / Ctrl to toggle) and a double-click plays. The title is a real
 * `<button>` whose clicks bubble to the row, which keeps the selection
 * reachable from the keyboard (Enter) without making the row focusable.
 * The leading cell doubles as the playback indicator / control, shared with
 * `MusicRow`: `PlayingButton` for the playing row, `PausedButton` for the
 * paused row, `TrackNumberButton` for any other row.
 *
 * The row itself is the right-click menu's trigger and the draggable
 * element, so sibling rows stay adjacent in the DOM for the selection
 * styling. The menu entries render twice, in the [...] dropdown and in the
 * right-click menu; both act on the same targets.
 */
export const PlaylistTableRow = ({
  columns,
  widthOf,
  music,
  ordinal,
  offset,
  locale,
  playing,
  selected,
  draggable,
  dropTarget,
  onSelect,
  onPlay,
  onTogglePlayPause,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  menuItems,
}: Props) => (
  <ContextMenu>
    <ContextMenuTrigger
      render={
        <tr
          // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
          role="row"
          data-selected={selected || undefined}
          draggable={draggable}
          className={rowClassName(playing !== null, selected, dropTarget)}
          style={{ transform: `translateY(${offset}px)` }}
          onClick={(event) => {
            if (isRowEvent(event)) {
              onSelect(event);
            }
          }}
          onDoubleClick={(event) => {
            if (isRowEvent(event)) {
              onPlay();
            }
          }}
          onDragStart={onDragStart}
          onDragOver={(event: DragEvent<HTMLTableRowElement>) => {
            event.preventDefault();
            onDragOver();
          }}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        />
      }
    >
      {columns.map((column) => {
        const style = { width: widthOf(column.id) };
        if (column.id === "ordinal") {
          return (
            <td
              key={column.id}
              // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
              role="cell"
              data-row-control
              className="flex shrink-0 items-center justify-end px-2 font-mono text-muted-foreground text-xs tabular-nums"
              style={style}
            >
              {playing === "playing" ? (
                <PlayingButton onPause={onTogglePlayPause} />
              ) : playing === "paused" ? (
                <PausedButton onResume={onTogglePlayPause} />
              ) : (
                <TrackNumberButton
                  number={ordinal}
                  title={music.title}
                  onPlay={onPlay}
                />
              )}
            </td>
          );
        }

        if (column.id === "menu") {
          return (
            <td
              key={column.id}
              // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
              role="cell"
              data-row-control
              className="flex shrink-0 items-center justify-end px-2"
              style={style}
            >
              <RowMenu items={menuItems} />
            </td>
          );
        }

        const content = renderPlaylistCell({
          columnId: column.id,
          music,
          current: playing !== null,
          locale,
        });
        return (
          <td
            key={column.id}
            // biome-ignore lint/a11y/noRedundantRoles: the display override drops the implicit role.
            role="cell"
            className={cn(
              "min-w-0 shrink-0 px-2",
              column.align === "end" ? "text-end" : "text-start",
            )}
            style={style}
          >
            {column.id === "title" ? (
              <button
                type="button"
                className="block w-full cursor-default text-start outline-none"
              >
                {content}
              </button>
            ) : (
              content
            )}
          </td>
        );
      })}
    </ContextMenuTrigger>
    <ContextMenuContent>
      <RowMenuEntries items={menuItems} />
    </ContextMenuContent>
  </ContextMenu>
);
