import type { PlaybackSnapshot } from "../audio/types";

/**
 * Whether a snapshot represents a track that finished on its own.
 *
 * The engine reports a natural end as `stopped` with the position pinned to
 * the duration; a manual `stop()` rewinds to `0` instead. PlayerProvider
 * uses this to advance the queue exactly once per track
 * (`docs/specs/v1.0/renderer/audio-engine.md`).
 *
 * @param snapshot - Engine snapshot.
 * @returns `true` for a natural end.
 */
export const isNaturalEnd = (snapshot: PlaybackSnapshot): boolean =>
  snapshot.state === "stopped" &&
  snapshot.duration > 0 &&
  snapshot.currentTime >= snapshot.duration - 0.01;
