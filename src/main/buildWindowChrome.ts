import {
  buildTitleBarOverlay,
  type TitleBarOverlayOptions,
} from "./buildTitleBarOverlay";

/**
 * Pure builder for the title-bar-less BrowserWindow configuration
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * Kept free of `electron` imports so the per-platform rules are unit-testable:
 * `main.ts` spreads the result into `new BrowserWindow(...)`.
 *
 * Platform mapping:
 * - macOS: `titleBarStyle: "hiddenInset"` — traffic lights at the top-left.
 * - Windows: `titleBarStyle: "hidden"` + `titleBarOverlay` (Window Controls
 *   Overlay) — controls at the top-right.
 * - Linux: same as Windows. Electron ships WCO support for Linux since v24;
 *   whether the running desktop environment honours it must be verified on a
 *   real Linux session (issue #30). If it turns out unusable, the fallback is
 *   in-app window controls (tracked for that verification, not built here).
 */

/** Subset of `BrowserWindowConstructorOptions` this builder decides. */
export type WindowChromeOptions = {
  readonly titleBarStyle: "hiddenInset" | "hidden";
  readonly titleBarOverlay?: TitleBarOverlayOptions;
  /**
   * Windows / Linux: keep Chromium from rendering the native menu bar as a
   * layout-consuming band above the web contents. The application menu stays
   * installed (accelerators keep working) and opens as a dropdown from the
   * in-app menu button via `mp:menu:popup`; Alt still reveals the native bar
   * as an accessibility fallback
   * (`docs/specs/v1.0/cross-platform/system-menu.md`).
   */
  readonly autoHideMenuBar?: true;
};

/**
 * Decide the title-bar options for a platform.
 *
 * @param platform - `process.platform` value (`"darwin"` / `"win32"` / …).
 * @param dark - Whether the dark theme is in effect (overlay colors).
 * @returns Options to spread into the `BrowserWindow` constructor.
 */
export const buildWindowChrome = (
  platform: NodeJS.Platform,
  dark: boolean,
): WindowChromeOptions =>
  platform === "darwin"
    ? { titleBarStyle: "hiddenInset" }
    : {
        titleBarStyle: "hidden",
        titleBarOverlay: buildTitleBarOverlay(dark),
        autoHideMenuBar: true,
      };
