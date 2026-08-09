import type { Music } from "@mp/ipc";

/**
 * Queue-position derivations (`docs/specs/v1.0/renderer/state-management.md`):
 * previous / next are computed from `queue` + `current` during render or in
 * commands — they are never stored in state.
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
 * @returns The next track, or `null` at the tail / outside the queue.
 */
export const nextOf = (
  queue: readonly Music[],
  current: Music | null,
): Music | null => {
  const index = indexOf(queue, current);
  return index >= 0 ? (queue[index + 1] ?? null) : null;
};
