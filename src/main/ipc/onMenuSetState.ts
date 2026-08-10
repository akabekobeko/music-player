import { setMenuState } from "../menu/applicationMenu";
import type { MenuStateSnapshot } from "./types";

/**
 * Channel handler for the `mp:menu:setState` send channel.
 *
 * @param _ev - Electron event object (unused).
 * @param snapshot - Menu-relevant state pushed by the Renderer.
 */
export const onMenuSetState = (
  _ev: Electron.IpcMainEvent,
  snapshot: MenuStateSnapshot,
): void => {
  setMenuState(snapshot);
};
