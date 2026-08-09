import { ipcMain } from "electron";
import { IpcKeys } from "./ipcKeys";
import { onGetSettings } from "./onGetSettings";
import { onGetVersions } from "./onGetVersions";
import { onSetSettings } from "./onSetSettings";

/**
 * Tracks whether {@link initializeIpcEvents} has already wired the handlers.
 *
 * Guard against double registration when the function is called more than
 * once during app startup (e.g. in tests that re-create the main process).
 */
let isInitialized = false;

/**
 * Wire every implemented channel up to its handler.
 *
 * Idempotent: a second call after a successful initialisation is a no-op so
 * the function is safe to invoke from multiple lifecycle hooks (`whenReady`,
 * `activate`, …). Handlers for the remaining {@link IpcKeys} channels are
 * registered here as later phases implement them.
 *
 * @returns void.
 */
export const initializeIpcEvents = (): void => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;
  ipcMain.handle(IpcKeys.GetVersions, onGetVersions);
  ipcMain.handle(IpcKeys.GetSettings, onGetSettings);
  ipcMain.handle(IpcKeys.SetSettings, onSetSettings);
};

/**
 * Detach every handler registered by {@link initializeIpcEvents}.
 *
 * Useful for shutdown paths and for tests that need a clean slate between
 * cases.
 *
 * @returns void.
 */
export const releaseIpcEvents = (): void => {
  if (!isInitialized) {
    return;
  }

  ipcMain.removeHandler(IpcKeys.GetVersions);
  ipcMain.removeHandler(IpcKeys.GetSettings);
  ipcMain.removeHandler(IpcKeys.SetSettings);
  isInitialized = false;
};
