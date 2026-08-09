/**
 * Platform classification used for cosmetic layout decisions only — the
 * title-bar safe-area fallbacks in `App.css` key off
 * `<html data-platform="…">`. Security-relevant branching stays in Main.
 */

/** Coarse platform bucket derived from the user agent. */
export type UiPlatform = "mac" | "windows" | "linux";

/**
 * Classify a user-agent string.
 *
 * @param userAgent - `navigator.userAgent`.
 * @returns The platform bucket; unknown agents fall back to `"linux"`
 * (safe-area fallbacks match the Windows/Linux layout).
 */
export const detectPlatform = (userAgent: string): UiPlatform => {
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return "mac";
  }

  if (/Windows/i.test(userAgent)) {
    return "windows";
  }

  return "linux";
};
