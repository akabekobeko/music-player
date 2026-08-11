import type { Music } from "@mp/ipc";
import { indexOf } from "./indexOf";

/**
 * The track after the current one in the queue
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * Replacement policy (`docs/specs/v1.0/features/playlist.md`): when the
 * queue is replaced mid-playback, the playing track continues and the
 * neighbours resolve against the NEW queue. A current track that is not in
 * the queue therefore has no previous (disabled) and the queue head as its
 * next — finishing the track (or pressing next) enters the new queue from
 * the top.
 *
 * @param queue - The current queue.
 * @param current - The current track.
 * @returns The next track; the queue head when the current track is not in
 *   the queue (replacement policy above); `null` at the tail or when the
 *   queue is empty.
 */
export const nextOf = (
  queue: readonly Music[],
  current: Music | null,
): Music | null => {
  const index = indexOf(queue, current);
  return index >= 0 ? (queue[index + 1] ?? null) : (queue[0] ?? null);
};
