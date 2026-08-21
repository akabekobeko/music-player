/**
 * Resolve the `BrowserWindow.backgroundColor` for a theme.
 *
 * Electron paints the window white until the Renderer's first frame, which
 * flashes on a dark theme. Matching the `--background` token in `App.css`
 * (`oklch(1 0 0)` / `oklch(0.145 0 0)`) makes the pre-paint window
 * indistinguishable from the app body.
 *
 * @param dark - Whether the dark theme is in effect.
 * @returns Hex color for the `backgroundColor` constructor option.
 */
export const buildWindowBackgroundColor = (dark: boolean): string =>
  dark ? "#0a0a0a" : "#ffffff";
