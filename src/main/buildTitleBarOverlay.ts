import { buildWindowBackgroundColor } from "./buildWindowBackgroundColor";

/** Overlay strip height in px (WCO reserves this much at the top edge). */
export const TITLE_BAR_OVERLAY_HEIGHT = 40;

/** `titleBarOverlay` colors for one resolved theme. */
export type TitleBarOverlayOptions = {
  readonly color: string;
  readonly symbolColor: string;
  readonly height: number;
};

/**
 * Resolve the WCO overlay background for a theme: the RGB of the toolbar
 * backdrop with a zero alpha.
 *
 * Alpha 0 keeps the strip transparent so the app's own toolbar background
 * shows through, the same way the macOS traffic lights sit on the page
 * (Electron skips painting a zero-alpha overlay on Windows since v25, and
 * on Linux the button containers get a transparent solid background). An
 * opaque color would draw a visible band over the toolbar wherever it
 * differs from the token underneath.
 *
 * The RGB still matters on Linux: the frame view forces the color opaque
 * and feeds it to the caption button provider as the backdrop for blending,
 * and KDE's Breeze style paints the hovered glyph in that color. With a
 * black RGB (`#00000000`) the light theme would hide the glyph on hover
 * (black on a near-black pill), so the RGB follows the `--background` token
 * that the content toolbar sits on, via {@link buildWindowBackgroundColor}.
 *
 * @param dark - Whether the dark theme is in effect.
 * @returns Eight-digit hex color (`#rrggbb00`).
 */
export const buildTitleBarOverlayColor = (dark: boolean): string =>
  `${buildWindowBackgroundColor(dark)}00`;

/**
 * Resolve the WCO overlay options for a theme.
 *
 * The background is always transparent (see {@link buildTitleBarOverlayColor});
 * the glyph color follows the theme. It has to be set explicitly: on Windows
 * Electron's default symbol color is the Win32 `COLOR_BTNTEXT` system color,
 * which ignores the OS dark mode, so an unset value would leave black glyphs
 * on the dark theme. The values match the `--foreground` tokens in `App.css`.
 *
 * @param dark - Whether the dark theme is in effect.
 * @returns Overlay options for `BrowserWindow` / `setTitleBarOverlay`.
 */
export const buildTitleBarOverlay = (
  dark: boolean,
): TitleBarOverlayOptions => ({
  color: buildTitleBarOverlayColor(dark),
  symbolColor: dark ? "#fafafa" : "#101a21",
  height: TITLE_BAR_OVERLAY_HEIGHT,
});
