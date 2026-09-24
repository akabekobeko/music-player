import type { Music } from "@mp/ipc";
import type { QueueSource } from "../types";

/**
 * The queue was replaced while playback continues (Phase 6 queue policy).
 * The current track is left as-is; previous / next resolve against the new
 * queue from now on.
 */
export type QueueReplacedAction = {
  /** Discriminant. */
  readonly type: "queueReplaced";
  /**
   * The new list in the view's order; installed as both `queue` and
   * `orderedQueue` as-is (no shuffle is applied even while shuffle is on).
   */
  readonly queue: readonly Music[];
  /** Which view supplied the list; becomes `queueSource`. */
  readonly source: QueueSource;
};
