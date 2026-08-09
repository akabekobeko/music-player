import { BrowserWindow } from "electron";

/**
 * Send a push payload to every open window.
 *
 * Push channels (`mp:library:importProgress`, `mp:library:changed`, …) are
 * app-level notifications, not replies to one caller, so they broadcast
 * rather than target `event.sender`.
 *
 * @param channel - Push channel name from `IpcKeys`.
 * @param payload - Structured-cloneable payload.
 */
export const broadcast = (channel: string, payload: unknown): void => {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
};
