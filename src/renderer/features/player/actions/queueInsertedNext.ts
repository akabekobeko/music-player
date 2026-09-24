import type { Music } from "@mp/ipc";

/**
 * Tracks were inserted right after the current track ("Play next"). With
 * no current track (or one outside the queue) they go to the head.
 */
export type QueueInsertedNextAction = {
  /** Discriminant. */
  readonly type: "queueInsertedNext";
  /**
   * Tracks inserted in this order after the current track, in both `queue`
   * and `orderedQueue` (each resolves the current position on its own).
   */
  readonly musics: readonly Music[];
};
