import type { PlaybackSnapshot } from "../types";
import type { InternalPlayback } from "./types";

/**
 * Project the internal state onto the published snapshot.
 *
 * @param internal - Internal state.
 * @returns The UI-facing snapshot (deferred seeks surface their target as
 *   `currentTime`, so the UI never shows a rewind).
 */
export const snapshotOfPlayback = (
  internal: InternalPlayback,
): PlaybackSnapshot => ({
  state: internal.state,
  currentTime: internal.pendingSeekTime ?? internal.currentTime,
  duration: internal.duration,
  volume: internal.volume,
  seeking: internal.pendingSeekTime !== null,
  bufferReady: internal.mode === "buffer",
  error: internal.error,
});
