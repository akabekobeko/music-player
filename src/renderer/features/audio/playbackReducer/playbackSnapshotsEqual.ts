import type { PlaybackSnapshot } from "../types";

/**
 * Field-wise equality of two snapshots (error compared by reference).
 *
 * @param a - One snapshot.
 * @param b - Another snapshot.
 * @returns `true` when nothing observable differs.
 */
export const playbackSnapshotsEqual = (
  a: PlaybackSnapshot,
  b: PlaybackSnapshot,
): boolean =>
  a.state === b.state &&
  a.currentTime === b.currentTime &&
  a.duration === b.duration &&
  a.volume === b.volume &&
  a.seeking === b.seeking &&
  a.bufferReady === b.bufferReady &&
  a.error === b.error;
