import {
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { HStack, Stack, VStack } from "@/components/app/stacks";
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
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { QueuePopover } from "./QueuePopover";
import { SeekBar } from "./SeekBar";
import { usePlayerBar } from "./usePlayerBar";
import { VolumeControl } from "./VolumeControl";

/**
 * Bottom full-width player band (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Sits below the sidebar and content columns, clear of the OS window
 * controls — the title-bar duties (drag region, safe areas) belong to the
 * toolbars now. Left to right: artwork, two-line track info (title /
 * artist - album) in a fixed-width column, transport controls, seek bar
 * with time labels, queue and volume — all vertically centered.
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

  const artistAlbum =
    current !== null && current.album !== ""
      ? `${current.artist} - ${current.album}`
      : (current?.artist ?? "");

  // Stop has no transport button (Apple Music-style) — it lives in the
  // Controls menu (CmdOrCtrl+.) and in this right-click menu on the bar.
  const bar = (
    <footer className="flex h-(--playerbar-height) items-center gap-3 border-t bg-sidebar px-3">
      {current?.picturePath != null ? (
        <img
          src={toMediaFileUrl(current.picturePath)}
          alt=""
          className="size-11 shrink-0 rounded object-cover"
        />
      ) : (
        <VStack className="size-11 shrink-0 rounded bg-muted">
          <Music aria-hidden className="size-5 text-muted-foreground" />
        </VStack>
      )}

      <Stack className="w-[30rem] shrink-0 gap-0.5">
        {current !== null ? (
          <>
            <EllipsisText
              className="font-medium text-sm"
              text={current.title}
            />
            <EllipsisText
              className="text-muted-foreground text-xs"
              text={artistAlbum}
            />
          </>
        ) : (
          <EllipsisText
            className="text-muted-foreground text-sm"
            text={t("player.noMusic")}
          />
        )}
      </Stack>

      <HStack className="gap-0.5">
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
      </HStack>

      <SeekBar
        className="min-w-0 flex-1"
        currentTime={snapshot.currentTime}
        duration={snapshot.duration}
        displayDuration={displayDuration}
        seeking={snapshot.seeking}
        onSeek={commands.seek}
      />

      <HStack className="gap-0.5">
        <QueuePopover />
        <VolumeControl volume={snapshot.volume} onChange={commands.setVolume} />
      </HStack>
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
