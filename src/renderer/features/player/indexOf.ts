import type { Music } from "@mp/ipc";

/**
 * Index of a track in the queue by identity, or `-1`.
 *
 * Shared by the queue-position derivations
 * ({@link import("./previousOf").previousOf} /
 * {@link import("./nextOf").nextOf}) — matches by `id`, not by object
 * identity.
 */
export const indexOf = (
  queue: readonly Music[],
  current: Music | null,
): number =>
  current === null ? -1 : queue.findIndex((music) => music.id === current.id);
