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
import { useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PlaybackError } from "@/features/audio/types";
import { useT } from "@/features/i18n/useT";
import { nextOf, previousOf } from "@/features/player/derive";
import {
  useAudioPlayer,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { SeekBar } from "./SeekBar";
import { VolumeControl } from "./VolumeControl";

/**
 * Top full-width player band doubling as the title bar
 * (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Background and padding are the drag region; every interactive element
 * opts out with `.app-region-no-drag`. The center block (artwork + track
 * info + seek bar) uses the band's full height; transport controls sit
 * bottom-left, volume bottom-right, so the top edge stays clear of the
 * window controls. All display state comes from the player state and the
 * engine snapshot — no polling.
 */
export const PlayerBar = () => {
  const t = useT();
  const { queue, current } = usePlayerState();
  const commands = usePlayerCommands();
  const snapshot = useAudioPlayer();
  const [dismissedError, setDismissedError] = useState<PlaybackError | null>(
    null,
  );

  const previous = previousOf(queue, current);
  const next = nextOf(queue, current);
  const hasTrack = current !== null;
  const isPlaying = snapshot.state === "playing";
  const isLoading = snapshot.state === "loading";
  // A new engine (track switch) resets `error` to null — auto-clear;
  // dismissing hides exactly this error object until a new one appears.
  const visibleError =
    snapshot.error !== null && snapshot.error !== dismissedError
      ? snapshot.error
      : null;
  // While the engine has no duration yet, fall back to mme's value for the
  // display only (VBR MP3 may be inaccurate — never used for seeking).
  const displayDuration =
    snapshot.duration > 0
      ? snapshot.duration
      : (current?.durationMs ?? 0) / 1000;

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

        <div className="app-region-no-drag flex items-end pr-2 pb-1.5">
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
              onClick={() => setDismissedError(visibleError)}
            >
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}
    </div>
  );
};
