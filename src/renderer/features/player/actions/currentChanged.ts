import type { Music } from "@mp/ipc";

/**
 * The current track moved within the existing queue (next / previous /
 * natural end advance). The queue itself is untouched.
 */
export type CurrentChangedAction = {
  readonly type: "currentChanged";
  readonly music: Music;
};
