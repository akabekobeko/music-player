import type { Music } from "@mp/ipc";

/** Tracks were appended to the queue tail ("Add to queue"). */
export type QueueAppendedAction = {
  /** Discriminant. */
  readonly type: "queueAppended";
  /**
   * Tracks appended in this order to both `queue` and `orderedQueue`;
   * duplicates of tracks already queued are not filtered.
   */
  readonly musics: readonly Music[];
};
