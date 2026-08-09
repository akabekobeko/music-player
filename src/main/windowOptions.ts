/**
 * Pure builders for the title-bar-less BrowserWindow configuration
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

/** Overlay strip height in px (WCO reserves this much at the top edge). */
export const TITLE_BAR_OVERLAY_HEIGHT = 40;

/** `titleBarOverlay` colors for one resolved theme. */
export type TitleBarOverlayOptions = {
  readonly color: string;
  readonly symbolColor: string;
  readonly height: number;
};

/**
 * Resolve the WCO overlay colors for a theme.
 *
 * Matches the `--sidebar` background tokens in `App.css` so the control strip
 * blends into the PlayerBar band.
 *
 * @param dark - Whether the dark theme is in effect.
 * @returns Overlay options for `BrowserWindow` / `setTitleBarOverlay`.
 */
export const buildTitleBarOverlay = (dark: boolean): TitleBarOverlayOptions =>
  dark
    ? {
        color: "#262626",
        symbolColor: "#fafafa",
        height: TITLE_BAR_OVERLAY_HEIGHT,
      }
    : {
        color: "#fafafa",
        symbolColor: "#171717",
        height: TITLE_BAR_OVERLAY_HEIGHT,
      };

/** Subset of `BrowserWindowConstructorOptions` this builder decides. */
export type WindowChromeOptions = {
  readonly titleBarStyle: "hiddenInset" | "hidden";
  readonly titleBarOverlay?: TitleBarOverlayOptions;
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
    : { titleBarStyle: "hidden", titleBarOverlay: buildTitleBarOverlay(dark) };
