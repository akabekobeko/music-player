import { BrowserWindow } from "electron";
import { buildTitleBarOverlay } from "../buildTitleBarOverlay";

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
