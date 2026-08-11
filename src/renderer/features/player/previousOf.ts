import type { Music } from "@mp/ipc";
import { indexOf } from "./indexOf";

/**
 * The track before the current one in the queue
 * (`docs/specs/v1.0/renderer/state-management.md`): previous / next are
 * computed from `queue` + `current` during render or in commands — they are
 * never stored in state.
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
