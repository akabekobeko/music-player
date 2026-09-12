import type { BrowserWindow } from "electron";
import { IpcKeys } from "./ipcKeys";
import type { WindowFullScreenChangedPayload } from "./types";

/**
 * Push the window's current full-screen state to its Renderer over
 * `mp:window:fullScreenChanged`.
 *
 * Full screen is per-window state, so this targets the given window rather
 * than broadcasting. Wired to `enter-full-screen` / `leave-full-screen` and
 * to `did-finish-load` (initial state after a load or reload).
 *
 * @param window - The window whose state to push.
 */
export const pushFullScreenState = (window: BrowserWindow): void => {
  if (window.isDestroyed()) {
    return;
  }

  const payload: WindowFullScreenChangedPayload = {
    fullScreen: window.isFullScreen(),
  };
  window.webContents.send(IpcKeys.WindowFullScreenChanged, payload);
};
