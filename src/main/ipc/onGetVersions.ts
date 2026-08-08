import { app } from "electron";
import type { IpcResult, Versions } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:app:getVersions`.
 *
 * Combines the app's own `package.json` version (`app.getVersion()`) with
 * `process.versions` for the about display.
 *
 * @param _ev - Electron event object (unused).
 * @returns A snapshot of the runtime stack versions.
 */
export const onGetVersions = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<Versions>> => {
  try {
    return {
      ok: true,
      value: {
        app: app.getVersion(),
        electron: process.versions.electron ?? "",
        chrome: process.versions.chrome ?? "",
        node: process.versions.node,
      },
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
