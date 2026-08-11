import type { PlaybackSnapshot } from "../../audio/types";

/**
 * Build the `setPositionState` payload for a snapshot.
 *
 * @param snapshot - Engine snapshot.
 * @returns The payload, or `null` while the duration is unknown (the
 *   position state is then cleared).
 */
export const positionStateOf = (
  snapshot: PlaybackSnapshot,
): { duration: number; position: number; playbackRate: number } | null =>
  snapshot.duration > 0
    ? {
        duration: snapshot.duration,
        position: Math.min(
          Math.max(0, snapshot.currentTime),
          snapshot.duration,
        ),
        playbackRate: 1,
      }
    : null;
