import { Square, X } from "lucide-react";
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
import { PlayerBand } from "./PlayerBand";
import { usePlayerBar } from "./usePlayerBar";

/**
 * Bottom full-width player band (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Sits below the sidebar and content columns, clear of the OS window
 * controls — the title-bar duties (drag region, safe areas) belong to the
 * toolbars now. Stacks the dismissable playback error alert above the band
 * (`PlayerBand`) and gives the band its right-click menu.
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
      {/* Stop has no transport button (Apple Music-style) — it lives in the
          Controls menu (CmdOrCtrl+.) and in this right-click menu on the bar. */}
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <PlayerBand
              current={current}
              commands={commands}
              snapshot={snapshot}
              shuffle={shuffle}
              previous={previous}
              next={next}
              hasTrack={hasTrack}
              isPlaying={isPlaying}
              isLoading={isLoading}
              displayDuration={displayDuration}
            />
          }
        />
        <ContextMenuContent>
          <ContextMenuItem disabled={!hasTrack} onClick={() => commands.stop()}>
            {/* Fill matches the transport icons' solid style. */}
            <Square className="fill-current" />
            {t("player.stop")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
