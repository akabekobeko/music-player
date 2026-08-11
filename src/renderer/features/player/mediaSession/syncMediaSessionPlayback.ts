import type { PlaybackSnapshot } from "../../audio/types";
import { hasMediaSession } from "./hasMediaSession";
import { playbackStateOf } from "./playbackStateOf";
import { positionStateOf } from "./positionStateOf";

/**
 * Sync `playbackState` and the position state from an engine snapshot
 * (`docs/specs/v1.0/features/player-ui.md`).
 *
 * Called from the engine subscription registered inside `startEngine` — the
 * sync never passes through React rendering.
 *
 * @param snapshot - Latest engine snapshot.
 */
export const syncMediaSessionPlayback = (snapshot: PlaybackSnapshot): void => {
  if (!hasMediaSession()) {
    return;
  }

  navigator.mediaSession.playbackState = playbackStateOf(snapshot.state);
  try {
    const position = positionStateOf(snapshot);
    if (position !== null) {
      navigator.mediaSession.setPositionState(position);
    } else {
      navigator.mediaSession.setPositionState();
    }
  } catch {
    // Chromium rejects transiently inconsistent values (e.g. position just
    // past a shrinking duration); the next snapshot corrects it.
  }
};
