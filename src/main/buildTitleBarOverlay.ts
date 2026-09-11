/** Overlay strip height in px (WCO reserves this much at the top edge). */
export const TITLE_BAR_OVERLAY_HEIGHT = 40;

/**
 * Fully transparent overlay background. With a zero alpha Electron skips
 * painting the control strip (Electron 25+), so the app's own toolbar
 * background shows through, the same way the macOS traffic lights sit on the
 * page. An opaque color here would draw a visible band over the toolbar
 * whenever it differs from the token underneath (`--background` in the
 * content area, `--sidebar` when the sidebar is closed).
 */
export const TITLE_BAR_OVERLAY_COLOR = "#00000000";

/** `titleBarOverlay` colors for one resolved theme. */
export type TitleBarOverlayOptions = {
  readonly color: string;
  readonly symbolColor: string;
  readonly height: number;
};

/**
 * Resolve the WCO overlay options for a theme.
 *
 * The background is always transparent; only the glyph color follows the
 * theme. It has to be set explicitly: on Windows Electron's default symbol
 * color is the Win32 `COLOR_BTNTEXT` system color, which ignores the OS dark
 * mode, so an unset value would leave black glyphs on the dark theme. The
 * values match the `--foreground` tokens in `App.css`.
 *
 * @param dark - Whether the dark theme is in effect.
 * @returns Overlay options for `BrowserWindow` / `setTitleBarOverlay`.
 */
export const buildTitleBarOverlay = (
  dark: boolean,
): TitleBarOverlayOptions => ({
  color: TITLE_BAR_OVERLAY_COLOR,
  symbolColor: dark ? "#fafafa" : "#0a0a0a",
  height: TITLE_BAR_OVERLAY_HEIGHT,
});
