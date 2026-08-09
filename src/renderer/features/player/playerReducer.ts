import type { CurrentChangedAction } from "./actions/currentChanged";
import type { PlayedAction } from "./actions/played";
import type { QueueAppendedAction } from "./actions/queueAppended";
import type { QueueInsertedNextAction } from "./actions/queueInsertedNext";
import type { QueueReplacedAction } from "./actions/queueReplaced";
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
  | QueueAppendedAction;

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
        queueSource: action.source,
        current: action.music,
      };
    case "currentChanged":
      return { ...state, current: action.music };
    case "queueReplaced":
      return {
        ...state,
        queue: action.queue,
        queueSource: action.source,
      };
    case "queueInsertedNext": {
      const index =
        state.current === null
          ? -1
          : state.queue.findIndex((music) => music.id === state.current?.id);
      const queue = [...state.queue];
      queue.splice(index + 1, 0, ...action.musics);
      return { ...state, queue };
    }
    case "queueAppended":
      return { ...state, queue: [...state.queue, ...action.musics] };
    default:
      return state;
  }
};
