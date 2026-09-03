import type { Music } from "@mp/ipc";
import type { MouseEvent, ReactNode } from "react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PausedButton } from "@/components/app/MusicRow/PausedButton";
import { PlayingButton } from "@/components/app/MusicRow/PlayingButton";
import { TrackNumberButton } from "@/components/app/MusicRow/TrackNumberButton";
import { HStack } from "@/components/app/stacks";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";

/** Row height in px — shared with virtualizers embedding these rows. */
export const MUSIC_ROW_HEIGHT = 36;

type Props = {
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
  /** Per-track menu slot (the [...] dropdown, #43). */
  readonly menu?: ReactNode;
};

/**
 * One track row shared by the Artist / Album / Playlist views
 * (`docs/specs/v1.0/features/artist-view.md`): track number / title /
 * duration / menu slot, with receptacles for the playing highlight,
 * selection, and playback wiring (#43 / later views).
 *
 * A row, not a list: the views own their (virtualized) list structure and
 * render one `MusicRow` per item, so the shared piece stays layout-agnostic.
 * The title is a real `<button>` (click = select, double-click = play,
 * Enter = select), keeping the container itself non-interactive.
 *
 * The leading cell doubles as the playback indicator / control (Apple Music
 * style), picked by `playing`: `PlayingButton` for the playing row,
 * `PausedButton` for the paused row, `TrackNumberButton` for any other
 * (stopped) row.
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
  menu,
}: Props) => {
  const number =
    ordinal !== undefined ? ordinal : music.track > 0 ? music.track : "-";

  return (
    <HStack
      data-selected={selected || undefined}
      className={cn(
        "group h-9 w-full rounded-md px-2 text-sm",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
    >
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
        className="min-w-0 flex-1 cursor-default pl-1 text-left outline-none"
        onClick={onClick}
        onDoubleClick={onPlay}
      >
        <EllipsisText
          className={cn(playing !== null && "font-medium text-primary")}
          text={music.title}
        />
      </button>
      {columns}
      <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
        {formatTime(music.durationMs / 1000)}
      </span>
      {menu !== undefined && <span className="shrink-0">{menu}</span>}
    </HStack>
  );
};
