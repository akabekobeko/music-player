import type { Music } from "@mp/ipc";

/**
 * Queue-position derivations (`docs/specs/v1.0/renderer/state-management.md`):
 * previous / next are computed from `queue` + `current` during render or in
 * commands — they are never stored in state.
 *
 * Replacement policy (`docs/specs/v1.0/features/playlist.md`): when the
 * queue is replaced mid-playback, the playing track continues and the
 * neighbours resolve against the NEW queue. A current track that is not in
 * the queue therefore has no previous (disabled) and the queue head as its
 * next — finishing the track (or pressing next) enters the new queue from
 * the top.
 */

/** Index of a track in the queue by identity, or `-1`. */
const indexOf = (queue: readonly Music[], current: Music | null): number =>
  current === null ? -1 : queue.findIndex((music) => music.id === current.id);

/**
 * The track before the current one in the queue.
 *
 * @param queue - The current queue.
 * @param current - The current track.
 * @returns The previous track, or `null` at the head / outside the queue.
 */
export const previousOf = (
  queue: readonly Music[],
  current: Music | null,
): Music | null => {
  const index = indexOf(queue, current);
  return index > 0 ? (queue[index - 1] ?? null) : null;
};

/**
 * The track after the current one in the queue.
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
