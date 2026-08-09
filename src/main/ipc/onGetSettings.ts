import { getSettings } from "../settings/settingsManager";
import type { AppSettings, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:settings:get`.
 *
 * Returns the in-memory settings owned by `settingsManager`; the Renderer
 * awaits this in its bootstrap (before `createRoot`) to decide the initial
 * theme and locale.
 *
 * @param _ev - Electron event object (unused).
 * @returns The settings currently in effect.
 */
export const onGetSettings = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<AppSettings>> => {
  try {
    return { ok: true, value: getSettings() };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
