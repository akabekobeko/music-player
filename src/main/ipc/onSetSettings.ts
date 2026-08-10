import { BrowserWindow, nativeTheme } from "electron";
import { installApplicationMenu } from "../menu/applicationMenu";
import { getSettings, updateSettings } from "../settings/settingsManager";
import { buildTitleBarOverlay } from "../windowOptions";
import type { AppSettings, IpcResult, SetSettingsRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Re-color the Window Controls Overlay of every open window for a theme.
 *
 * Only Windows / Linux windows created with `titleBarOverlay` expose
 * `setTitleBarOverlay`; the capability check keeps macOS (and any window
 * without WCO) a no-op, so no platform branching is needed at the call site.
 *
 * @param dark - Whether the dark theme is now in effect.
 */
export const applyTitleBarOverlayTheme = (dark: boolean): void => {
  const overlay = buildTitleBarOverlay(dark);
  for (const window of BrowserWindow.getAllWindows()) {
    const candidate = window as {
      setTitleBarOverlay?: (options: typeof overlay) => void;
    };
    if (typeof candidate.setTitleBarOverlay === "function") {
      try {
        candidate.setTitleBarOverlay(overlay);
      } catch {
        // Window was created without WCO (e.g. macOS) — nothing to sync.
      }
    }
  }
};

/**
 * Resolve a theme preference to the dark flag, deferring `"system"` (and
 * unset) to the OS via `nativeTheme`.
 *
 * @param theme - Persisted preference, possibly `undefined`.
 * @returns `true` when the dark palette should be used.
 */
const isDarkTheme = (theme: AppSettings["theme"]): boolean =>
  theme === "dark" ||
  ((theme === "system" || theme === undefined) &&
    nativeTheme.shouldUseDarkColors);

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
