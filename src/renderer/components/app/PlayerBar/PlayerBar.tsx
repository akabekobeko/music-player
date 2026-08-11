import {
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  X,
} from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { QueuePopover } from "./QueuePopover";
import { SeekBar } from "./SeekBar";
import { usePlayerBar } from "./usePlayerBar";
import { VolumeControl } from "./VolumeControl";

/**
 * Top full-width player band doubling as the title bar
 * (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Background and padding are the drag region; every interactive element
 * opts out with `.app-region-no-drag`. The center block (artwork + track
 * info + seek bar) uses the band's full height; transport controls sit
 * bottom-left, volume bottom-right, so the top edge stays clear of the
 * window controls.
 */
export const PlayerBar = () => {
  const t = useT();
  const {
    current,
    commands,
    snapshot,
    previous,
    next,
    hasTrack,
    isPlaying,
    isLoading,
    visibleError,
    displayDuration,
    dismissError,
  } = usePlayerBar();

  return (
    <div className="col-span-2">
      <header className="app-region-drag flex h-(--playerbar-height) items-stretch gap-3 border-b bg-sidebar pr-(--titlebar-safe-right) pl-(--titlebar-safe-left)">
        <div className="app-region-no-drag flex items-end gap-0.5 pb-1.5 pl-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("player.previous")}
            disabled={previous === null}
            onClick={() => void commands.playPrevious()}
          >
            <SkipBack />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isPlaying ? t("player.pause") : t("player.play")}
            disabled={!hasTrack}
            onClick={() => commands.togglePlayPause()}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : isPlaying ? (
              <Pause />
            ) : (
              <Play />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("player.next")}
            disabled={next === null}
            onClick={() => void commands.playNext()}
          >
            <SkipForward />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("player.stop")}
            disabled={!hasTrack}
            onClick={() => commands.stop()}
          >
            <Square />
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 pt-2.5 pb-1.5">
          {current?.picturePath != null ? (
            <img
              src={toMediaFileUrl(current.picturePath)}
              alt=""
              className="size-11 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded bg-muted">
              <Music aria-hidden className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              {current !== null ? (
                <>
                  <span className="font-medium">{current.title}</span>
                  <span className="text-muted-foreground">
                    {" / "}
                    {current.artist}
                    {current.album !== "" ? ` — ${current.album}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {t("player.noMusic")}
                </span>
              )}
            </p>
            <SeekBar
              currentTime={snapshot.currentTime}
              duration={snapshot.duration}
              displayDuration={displayDuration}
              seeking={snapshot.seeking}
              onSeek={commands.seek}
            />
          </div>
        </div>

        <div className="app-region-no-drag flex items-end gap-0.5 pr-2 pb-1.5">
          <QueuePopover />
          <VolumeControl
            volume={snapshot.volume}
            onChange={commands.setVolume}
          />
        </div>
      </header>
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
    </div>
  );
};
