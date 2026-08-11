import { getActivePlayer } from "../playerBridge";
import { hasMediaSession } from "./hasMediaSession";

/** One-shot guard for {@link registerMediaSessionHandlers}. */
let handlersRegistered = false;

/**
 * Register the MediaSession action handlers exactly once
 * (`docs/specs/v1.0/features/player-ui.md`): OS media controls and hardware
 * media keys via the Web standard API.
 *
 * Called from PlayerProvider's render (guarded, so StrictMode's double
 * render cannot re-register). Handlers resolve the commands through the
 * player bridge at event time, so they never go stale.
 */
export const registerMediaSessionHandlers = (): void => {
  if (!hasMediaSession() || handlersRegistered) {
    return;
  }

  handlersRegistered = true;
  const session = navigator.mediaSession;

  session.setActionHandler("play", () => {
    const player = getActivePlayer();
    if (player !== null && player.getSnapshot().state !== "playing") {
      player.commands.togglePlayPause();
    }
  });
  session.setActionHandler("pause", () => {
    const player = getActivePlayer();
    if (player !== null && player.getSnapshot().state === "playing") {
      player.commands.togglePlayPause();
    }
  });
  session.setActionHandler("previoustrack", () => {
    void getActivePlayer()?.commands.playPrevious();
  });
  session.setActionHandler("nexttrack", () => {
    void getActivePlayer()?.commands.playNext();
  });
  session.setActionHandler("seekto", (details) => {
    if (details.seekTime !== undefined && details.seekTime !== null) {
      getActivePlayer()?.commands.seek(details.seekTime);
    }
  });
};
