import type { Music } from "@mp/ipc";

/**
 * Tracks were inserted right after the current track ("Play next"). With
 * no current track (or one outside the queue) they go to the head.
 */
export type QueueInsertedNextAction = {
  readonly type: "queueInsertedNext";
  readonly musics: readonly Music[];
};
