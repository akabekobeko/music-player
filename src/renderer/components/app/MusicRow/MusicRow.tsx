import type { Music } from "@mp/ipc";
import type { MouseEvent, ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { EllipsisText } from "../EllipsisText/EllipsisText";
import { RowMenu, type RowMenuItems } from "../RowMenu/RowMenu";
import { RowMenuEntries } from "../RowMenu/RowMenuItems";
import { PausedButton } from "./PausedButton";
import { PlayingButton } from "./PlayingButton";
import { TrackNumberButton } from "./TrackNumberButton";

/** Row height in px — shared with virtualizers embedding these rows. */
export const MUSIC_ROW_HEIGHT = 36;

type Props = {
  /** The track this row shows: title, duration, and track number. */
  readonly music: Music;
  /**
   * Number shown in the leading cell instead of the track number (the
   * Playlist view shows the 1-based position — position is the entry's
   * identity there, not the track).
   */
  readonly ordinal?: number;
  /**
   * Extra middle columns between the title and the duration (e.g. the
   * Playlist view's artist / album). The slot keeps the row layout-agnostic.
   */
  readonly columns?: ReactNode;
  /** Non-null when this is the current track ("playing" / "paused"). */
  readonly playing?: "playing" | "paused" | null;
  /** Whether the row is part of the multi-selection; defaults to `false`. */
  readonly selected?: boolean;
  /** Selection handler (click; Shift / Cmd arrive via the event). */
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Start playback from this track (hover play button / double-click). */
  readonly onPlay?: () => void;
  /**
   * Toggle play / pause of the current track (the current row's hover pause /
   * play button — the play button resumes from the paused position, unlike `onPlay`).
   */
  readonly onTogglePlayPause?: () => void;
  /**
   * Per-track menu entries (#43), shown by the [...] dropdown and by the
   * row's right-click menu alike.
   */
  readonly menuItems: RowMenuItems;
};

/**
 * Classes for the row container. The hovered and the selected row show the
 * rounded accent rectangle, as does the row whose right-click menu is open
 * (`data-popup-open`, set by the context-menu trigger) so the menu's target
 * stays visible while the pointer is inside the menu; the playing / paused
 * row lights that rectangle's border up with a blurred glow like the album
 * artwork in `AlbumCard` / `AlbumHeaderRow` (plain border plus blur, no
 * spread ring, so it reads as a calm lamp next to the hovered artwork),
 * whatever its selection. Every row
 * keeps a transparent border so lighting it never shifts the content. Rows
 * abut each other, so the glow reaches into the neighbouring rows: the row
 * is `relative` so that in a plain-flow list it paints above the following
 * row's opaque accent background; virtualised lists raise the wrapper of the
 * playing row instead (their transformed wrappers are stacking contexts).
 * Contiguous selected rows merge into one rounded rectangle like Apple
 * Music: a selected row squares off the corners it shares with a selected
 * neighbour (`selected-above` / `selected-below` in `App.css` look at the
 * sibling row or, in virtualised lists, the sibling wrapper).
 */
const rowClassName = (playing: boolean, selected: boolean): string =>
  cn(
    "group relative flex h-9 w-full flex-row items-center gap-2 rounded-md border border-transparent px-2 text-sm transition-[border-color,box-shadow] duration-200",
    selected
      ? "bg-accent text-accent-foreground selected-above:rounded-t-none selected-below:rounded-b-none"
      : "hover:bg-accent/50 data-popup-open:bg-accent/50",
    playing &&
      "border-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
  );

/**
 * One track row shared by the Artist / Album / Playlist views
 * (`docs/specs/v1.0/features/artist-view.md`): track number / title /
 * duration / menu slot, with receptacles for the playing highlight,
 * selection, and playback wiring (#43 / later views).
 *
 * A row, not a list: the views own their (virtualized) list structure and
 * render one `MusicRow` per item, so the shared piece stays layout-agnostic.
 * The title is a real `<button>` (click = select, double-click = play,
 * Enter = select), keeping the container itself non-interactive. The button
 * also holds the extra columns and the duration and stretches to the row
 * height, so a click anywhere between the leading cell and the menu lands on
 * it; only the leading cell (play / pause) and the menu keep their own
 * controls, so opening the menu never resets a multi-selection.
 *
 * The menu entries render twice: in the [...] dropdown (`RowMenu`) and in
 * the right-click menu of the whole row (`ContextMenu`, the row itself is
 * the trigger element so the sibling-based selection styling still sees
 * rows next to each other). Both act on the same targets, so right-clicking
 * a row of the multi-selection addresses the selection like its [...] does.
 *
 * The leading cell doubles as the playback indicator / control (Apple Music
 * style), picked by `playing`: `PlayingButton` for the playing row,
 * `PausedButton` for the paused row, `TrackNumberButton` for any other
 * (stopped) row. The playing / paused row also lights its rounded border up
 * with a blurred glow (see `rowClassName`), like the album artwork in the
 * Artists / Albums views.
 */
export const MusicRow = ({
  music,
  ordinal,
  columns,
  playing = null,
  selected = false,
  onClick,
  onPlay,
  onTogglePlayPause,
  menuItems,
}: Props) => {
  const number =
    ordinal !== undefined ? ordinal : music.track > 0 ? music.track : "-";

  const cells = (
    <>
      <span className="flex w-7 shrink-0 items-center justify-end font-mono text-muted-foreground text-xs tabular-nums">
        {playing === "playing" ? (
          <PlayingButton onPause={onTogglePlayPause} />
        ) : playing === "paused" ? (
          <PausedButton onResume={onTogglePlayPause} />
        ) : (
          <TrackNumberButton
            number={number}
            title={music.title}
            onPlay={onPlay}
          />
        )}
      </span>
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-default items-center gap-2 self-stretch pl-1 text-left outline-none"
        onClick={onClick}
        onDoubleClick={onPlay}
      >
        <EllipsisText
          className={cn(
            "min-w-0 flex-1",
            playing !== null && "font-medium text-primary",
          )}
          text={music.title}
        />
        {columns}
        <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
          {formatTime(music.durationMs / 1000)}
        </span>
      </button>
      <span className="shrink-0">
        <RowMenu items={menuItems} />
      </span>
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-selected={selected || undefined}
        className={rowClassName(playing !== null, selected)}
      >
        {cells}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <RowMenuEntries items={menuItems} />
      </ContextMenuContent>
    </ContextMenu>
  );
};
