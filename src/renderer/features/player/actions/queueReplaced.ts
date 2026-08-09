import type { Music } from "@mp/ipc";
import type { QueueSource } from "../types";

/**
 * The queue was replaced while playback continues (Phase 6 queue policy).
 * The current track is left as-is; previous / next resolve against the new
 * queue from now on.
 */
export type QueueReplacedAction = {
  readonly type: "queueReplaced";
  readonly queue: readonly Music[];
  readonly source: QueueSource;
};
