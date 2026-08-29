import { X } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useT } from "@/features/i18n/useT";
import { MusicInfo } from "./MusicInfo";
import { Picture } from "./Picture";
import { PlayerControls } from "./PlayerControls";
import { SecondaryControls } from "./SecondaryControls/SecondaryControls";
import { SeekBar } from "./SeekBar";
import { ShuffleButton } from "./ShuffleButton";
import { usePlayerBar } from "./usePlayerBar";

/**
 * Bottom full-width player band (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Sits below the sidebar and content columns, clear of the OS window
 * controls — the title-bar duties (drag region, safe areas) belong to the
 * toolbars now. Left to right: artwork, two-line track info (title /
 * artist - album) in a fixed-width column, transport controls, seek bar
 * with time labels, shuffle toggle, queue and volume — all vertically
 * centered.
 */
export const PlayerBar = () => {
  const t = useT();
  const {
    current,
    commands,
    snapshot,
    shuffle,
    previous,
    next,
    hasTrack,
    isPlaying,
    isLoading,
    visibleError,
    displayDuration,
    dismissError,
  } = usePlayerBar();

  // Stop has no transport button (Apple Music-style) — it lives in the
  // Controls menu (CmdOrCtrl+.) and in this right-click menu on the bar.
  const bar = (
    <footer className="flex h-(--playerbar-height) items-center gap-3 border-t bg-sidebar px-3">
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
      <ShuffleButton
        active={shuffle}
        onToggle={() => commands.toggleShuffle()}
      />
      <SecondaryControls
        volume={snapshot.volume}
        onVolumeChange={commands.setVolume}
      />
    </footer>
  );

  return (
    <div className="shrink-0">
      {visibleError !== null && (
        <Alert variant="destructive" className="rounded-none border-x-0">
          <AlertTitle>{t("player.errorTitle")}</AlertTitle>
          <AlertDescription className="break-all">
            [{visibleError.kind}] {visibleError.message}
          </AlertDescription>
          <AlertAction>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("player.dismiss")}
              onClick={dismissError}
            >
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}
      <ContextMenu>
        <ContextMenuTrigger render={bar} />
        <ContextMenuContent>
          <ContextMenuItem disabled={!hasTrack} onClick={() => commands.stop()}>
            {t("player.stop")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
