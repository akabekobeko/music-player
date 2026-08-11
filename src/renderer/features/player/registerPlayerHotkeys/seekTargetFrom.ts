import type { PlaybackSnapshot } from "../../audio/types";

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
