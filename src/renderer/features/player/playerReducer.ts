import type { Music } from "@mp/ipc";
import type { CurrentChangedAction } from "./actions/currentChanged";
import type { PlayedAction } from "./actions/played";
import type { QueueAppendedAction } from "./actions/queueAppended";
import type { QueueInsertedNextAction } from "./actions/queueInsertedNext";
import type { QueueReplacedAction } from "./actions/queueReplaced";
import type { ShuffleChangedAction } from "./actions/shuffleChanged";
import type { PlayerState } from "./types";

/**
 * Pure synchronous reducer of the player state
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * There are no async actions: side effects (engine swaps, IPC) happen in
 * the commands, which then dispatch one of these plain notifications.
 * One action per file under `./actions/` (audio-player convention kept).
 */
export type PlayerAction =
  | PlayedAction
  | CurrentChangedAction
  | QueueReplacedAction
  | QueueInsertedNextAction
  | QueueAppendedAction
  | ShuffleChangedAction;

/**
 * Advance the player state by one action.
 *
 * @param state - Current state.
 * @param action - Notification from a command.
 * @returns The next state.
 */
export const playerReducer = (
  state: PlayerState,
  action: PlayerAction,
): PlayerState => {
  switch (action.type) {
    case "played":
      return {
        queue: action.queue,
        orderedQueue: action.orderedQueue,
        queueSource: action.source,
        current: action.music,
        shuffle: action.shuffle,
      };
    case "currentChanged":
      return { ...state, current: action.music };
    case "queueReplaced":
      return {
        ...state,
        queue: action.queue,
        orderedQueue: action.queue,
        queueSource: action.source,
      };
    case "queueInsertedNext": {
      // Insert after the current track in both orders; each queue resolves
      // the current position independently (the orders differ under shuffle).
      const insertAfterCurrent = (queue: readonly Music[]): Music[] => {
        const index =
          state.current === null
            ? -1
            : queue.findIndex((music) => music.id === state.current?.id);
        const next = [...queue];
        next.splice(index + 1, 0, ...action.musics);
        return next;
      };
      return {
        ...state,
        queue: insertAfterCurrent(state.queue),
        orderedQueue: insertAfterCurrent(state.orderedQueue),
      };
    }
    case "queueAppended":
      return {
        ...state,
        queue: [...state.queue, ...action.musics],
        orderedQueue: [...state.orderedQueue, ...action.musics],
      };
    case "shuffleChanged":
      return { ...state, shuffle: action.shuffle, queue: action.queue };
    default:
      return state;
  }
};
