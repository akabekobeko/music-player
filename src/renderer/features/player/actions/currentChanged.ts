import type { Music } from "@mp/ipc";

/**
 * The current track moved within the existing queue (next / previous /
 * natural end advance). The queue itself is untouched.
 */
export type CurrentChangedAction = {
  /** Discriminant. */
  readonly type: "currentChanged";
  /** The track that became current; always a member of the queue. */
  readonly music: Music;
};
