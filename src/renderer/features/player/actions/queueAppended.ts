import type { Music } from "@mp/ipc";

/** Tracks were appended to the queue tail ("Add to queue"). */
export type QueueAppendedAction = {
  readonly type: "queueAppended";
  readonly musics: readonly Music[];
};
