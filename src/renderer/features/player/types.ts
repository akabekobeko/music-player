import type { Music } from "@mp/ipc";

/**
 * Player-domain types (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * The queue and the current track are pure app state: the audio engine
 * instance never appears here (it lives in the engine host, outside React).
 */

/** Which view operation installed the current queue. */
export type QueueSource = "artist" | "album" | "playlist" | "none";

/** Pure player state managed by the reducer. */
export type PlayerState = {
  /** The current queue (playback order). */
  readonly queue: readonly Music[];
  readonly queueSource: QueueSource;
  /** Currently loaded track; stays on the tail after the queue ends. */
  readonly current: Music | null;
  // previous / next are derived from queue + current — never stored.
};

/** State before any playback. */
export const INITIAL_PLAYER_STATE: PlayerState = {
  queue: [],
  queueSource: "none",
  current: null,
};
