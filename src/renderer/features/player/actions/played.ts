import type { Music } from "@mp/ipc";
import type { QueueSource } from "../types";

/**
 * A track was started from a view: the queue is replaced and the track
 * becomes current. Dispatched by the `playMusic` / `playShuffled` commands
 * after the engine swap succeeded (the reducer itself stays pure — the
 * command does the shuffling and passes both orders here).
 */
export type PlayedAction = {
  readonly type: "played";
  readonly music: Music;
  /** Playback order (already shuffled when `shuffle` is true). */
  readonly queue: readonly Music[];
  /** The view's natural order — the restore target when shuffle turns off. */
  readonly orderedQueue: readonly Music[];
  readonly source: QueueSource;
  /** Shuffle mode after this play (`playShuffled` turns it on). */
  readonly shuffle: boolean;
};
