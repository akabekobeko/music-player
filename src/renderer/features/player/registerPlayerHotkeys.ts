import type { PlaybackSnapshot } from "../audio/types";
import { getActivePlayer } from "./playerBridge";

/** Seek step of the arrow-key hotkeys, in seconds. */
export const SEEK_STEP_SEC = 5;

/**
 * Resolve an arrow-key seek to its absolute target.
 *
 * @param snapshot - Current playback snapshot.
 * @param deltaSec - Signed step (`±SEEK_STEP_SEC`).
 * @returns The clamped target, or `null` while the duration is unknown.
 */
export const seekTargetFrom = (
  snapshot: PlaybackSnapshot,
  deltaSec: number,
): number | null =>
  snapshot.duration > 0
    ? Math.min(Math.max(0, snapshot.currentTime + deltaSec), snapshot.duration)
    : null;

/**
 * Elements that own their key handling — hotkeys must not fire from them
 * (text inputs, the seek/volume sliders, buttons where Space means click).
 */
const INTERACTIVE_SELECTOR =
  "input, textarea, select, button, a, [contenteditable], [data-slot=slider], [role=slider]";

/** Whether the event target should swallow player hotkeys. */
const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.closest(INTERACTIVE_SELECTOR) !== null;

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
