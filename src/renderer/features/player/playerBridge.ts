import type { PlaybackSnapshot } from "../audio/types";
import type { PlayerCommands } from "./PlayerProvider";

/**
 * Module-level pointer to the mounted player.
 *
 * App-lifetime listeners registered outside React (keyboard hotkeys, and
 * the MediaSession action handlers in #39) need "always the current
 * commands" without subscribing to a Context. The provider updates this
 * pointer during render — an idempotent assignment, safe under StrictMode
 * double-rendering (unlike registering listeners in an initializer, which
 * would duplicate them).
 */
export type ActivePlayer = {
  readonly commands: PlayerCommands;
  readonly getSnapshot: () => PlaybackSnapshot;
};

let active: ActivePlayer | null = null;

/** Publish (or clear) the mounted player. Called by PlayerProvider. */
export const setActivePlayer = (player: ActivePlayer | null): void => {
  active = player;
};

/** The mounted player, or `null` before the provider mounted. */
export const getActivePlayer = (): ActivePlayer | null => active;
