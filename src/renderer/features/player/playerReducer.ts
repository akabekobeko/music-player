import type { CurrentChangedAction } from "./actions/currentChanged";
import type { PlayedAction } from "./actions/played";
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
  | QueueReplacedAction;

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
    default:
      return state;
  }
};
