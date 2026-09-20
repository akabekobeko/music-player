import type { ComponentProps } from "react";
import { cn } from "@/libs/utils";
import { MusicInfo } from "./MusicInfo";
import { Picture } from "./Picture";
import { PlayerControls } from "./PlayerControls";
import { SecondaryControls } from "./SecondaryControls/SecondaryControls";
import { SeekBar } from "./SeekBar";
import { ShuffleButton } from "./ShuffleButton";
import type { usePlayerBar } from "./usePlayerBar";

type Props = Pick<
  ReturnType<typeof usePlayerBar>,
  | "current"
  | "commands"
  | "snapshot"
  | "shuffle"
  | "previous"
  | "next"
  | "hasTrack"
  | "isPlaying"
  | "isLoading"
  | "displayDuration"
> &
  /**
   * Props of the `footer`, merged in by the `ContextMenuTrigger` that
   * renders the band (`render` prop): the right-click handler, ref, etc.
   */
  ComponentProps<"footer">;

/**
 * The player band itself (`docs/specs/v1.0/features/player-ui.md`), left to
 * right: artwork, two-line track info (title / artist - album) in a
 * fixed-width column, transport controls, seek bar with time labels,
 * shuffle toggle, queue and volume — all vertically centered. `PlayerBar`
 * wraps it with the error alert and the right-click menu.
 */
export const PlayerBand = ({
  current,
  commands,
  snapshot,
  shuffle,
  previous,
  next,
  hasTrack,
  isPlaying,
  isLoading,
  displayDuration,
  className,
  ...props
}: Props) => (
  <footer
    className={cn(
      "flex h-(--playerbar-height) items-center gap-3 border-t bg-sidebar px-3",
      className,
    )}
    {...props}
  >
    <Picture picturePath={current?.picturePath ?? null} />
    <MusicInfo music={current} />
    <PlayerControls
      hasPrevious={previous !== null}
      hasNext={next !== null}
      hasTrack={hasTrack}
      isPlaying={isPlaying}
      isLoading={isLoading}
      onPrevious={() => void commands.playPrevious()}
      onTogglePlayPause={() => commands.togglePlayPause()}
      onNext={() => void commands.playNext()}
    />
    <SeekBar
      className="min-w-0 flex-1"
      currentTime={snapshot.currentTime}
      duration={snapshot.duration}
      displayDuration={displayDuration}
      seeking={snapshot.seeking}
      onSeek={commands.seek}
    />
    <ShuffleButton active={shuffle} onToggle={() => commands.toggleShuffle()} />
    <SecondaryControls
      volume={snapshot.volume}
      onVolumeChange={commands.setVolume}
    />
  </footer>
);
