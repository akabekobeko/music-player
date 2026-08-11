import { installApplicationMenu } from "../../menu/applicationMenu";
import { getSettings, updateSettings } from "../../settings/settingsManager";
import { applyTitleBarOverlayTheme } from "../applyTitleBarOverlayTheme";
import type { AppSettings, IpcResult, SetSettingsRequest } from "../types";
import { toIpcError } from "../utils/toIpcError";
import { isDarkTheme } from "./isDarkTheme";

/**
 * Channel handler for `mp:settings:set`.
 *
 * Merges the patch (explicit-field strategy), schedules persistence, and
 * returns the merged snapshot — the Renderer overwrites its state with the
 * response, never with its own optimistic copy. A theme change also re-colors
 * the title-bar overlay so the native controls follow the app theme
 * (`docs/specs/v1.0/architecture/process-model.md`).
 *
 * @param _ev - Electron event object (unused).
 * @param request - The settings patch.
 * @returns The merged settings.
 */
export const onSetSettings = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetSettingsRequest,
): Promise<IpcResult<AppSettings>> => {
  try {
    const before = getSettings();
    const merged = updateSettings(request?.patch ?? {});
    if (merged.theme !== before.theme) {
      applyTitleBarOverlayTheme(isDarkTheme(merged.theme));
    }

    // The native menu renders its labels in the app locale — rebuild it
    // when the language preference changes.
    if (merged.locale !== before.locale) {
      installApplicationMenu();
    }

    return { ok: true, value: merged };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
