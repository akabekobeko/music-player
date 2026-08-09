import type { Music } from "@mp/ipc";
import type { QueueSource } from "../types";

/**
 * A track was started from a view: the queue is replaced and the track
 * becomes current. Dispatched by the `playMusic` command after the engine
 * swap succeeded (the reducer itself stays pure).
 */
export type PlayedAction = {
  readonly type: "played";
  readonly music: Music;
  readonly queue: readonly Music[];
  readonly source: QueueSource;
};
