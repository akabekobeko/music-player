import { clampVolume } from "../clampVolume";
import type { InternalPlayback } from "./types";

/**
 * Build the state an engine starts in (`state: "loading"` from the first
 * synchronous snapshot — the factory never returns a Promise).
 *
 * @param volume - Initial volume handed over by PlayerProvider.
 * @returns The initial internal state.
 */
export const createInitialPlayback = (volume: number): InternalPlayback => ({
  mode: "streaming",
  state: "loading",
  intendedPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: clampVolume(volume),
  pendingSeekTime: null,
  error: null,
  closed: false,
});
