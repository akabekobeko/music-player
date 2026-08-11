import { getActivePlayer } from "../playerBridge";
import { isInteractiveTarget } from "./isInteractiveTarget";
import { SEEK_STEP_SEC, seekTargetFrom } from "./seekTargetFrom";

/**
 * Register the player keyboard shortcuts
 * (`docs/specs/v1.0/features/player-ui.md`): Space toggles play / pause,
 * ← / → seek by {@link SEEK_STEP_SEC} seconds.
 *
 * App-lifetime listener, registered once from the bootstrap; commands are
 * resolved through the player bridge at press time so the handler never
 * goes stale.
 */
export const registerPlayerHotkeys = (): void => {
  document.addEventListener("keydown", (event) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    const player = getActivePlayer();
    if (player === null) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault(); // Also stops the page from scrolling.
      player.commands.togglePlayPause();
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      const delta = event.code === "ArrowLeft" ? -SEEK_STEP_SEC : SEEK_STEP_SEC;
      const target = seekTargetFrom(player.getSnapshot(), delta);
      if (target !== null) {
        event.preventDefault();
        player.commands.seek(target);
      }
    }
  });
};
