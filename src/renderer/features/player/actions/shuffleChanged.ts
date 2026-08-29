import type { Music } from "@mp/ipc";

/**
 * The PlayerBar's shuffle toggle changed. The command computes the new
 * playback order (a fresh shuffle, or the ordered queue restored) and
 * passes it here; `orderedQueue` is untouched.
 */
export type ShuffleChangedAction = {
  readonly type: "shuffleChanged";
  readonly shuffle: boolean;
  /** The new playback order for the existing tracks. */
  readonly queue: readonly Music[];
};
