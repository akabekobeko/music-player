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
