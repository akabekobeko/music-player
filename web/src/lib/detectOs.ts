/**
 * Operating systems the download page can tailor itself to. Same spelling
 * as the `os` part of a Platform (`data-os`) and of the i18n keys.
 */
export type DetectedOs = "mac" | "win" | "linux";

/** What the browser reveals about the device. */
export type BrowserInfo = {
  /** `navigator.userAgentData.platform` or `navigator.platform`. */
  readonly platform: string | undefined;
  /** `navigator.userAgent`, used to rule out phones and tablets. */
  readonly userAgent: string;
  /** `navigator.maxTouchPoints`; iPadOS Safari reports "MacIntel" + touch. */
  readonly maxTouchPoints: number;
};

/**
 * Map what the browser exposes to one of the download targets. Phones and
 * tablets return `undefined` (there is no build for them), which keeps the
 * default card order.
 *
 * @param info - Platform string, user agent and touch support.
 * @returns The detected OS.
 */
export const detectOs = ({
  platform,
  userAgent,
  maxTouchPoints,
}: BrowserInfo): DetectedOs | undefined => {
  if (platform === undefined) return undefined;
  if (/android|iphone|ipad|ipod|mobile/i.test(userAgent)) return undefined;
  const value = platform.toLowerCase();
  if (value.startsWith("mac")) {
    // iPadOS asks for desktop sites as "MacIntel"; a Mac has no touch screen.
    return maxTouchPoints > 1 ? undefined : "mac";
  }
  if (value.startsWith("win")) return "win";
  if (value.startsWith("linux")) {
    // Firefox for Android reports "Linux armv8l" / "Linux aarch64".
    return /arm|aarch64/.test(value) ? undefined : "linux";
  }
  return undefined;
};

/**
 * Collect the browser facts {@link detectOs} needs, preferring the Client
 * Hints API over the deprecated `navigator.platform`.
 *
 * @returns The browser info.
 */
export const browserInfo = (): BrowserInfo => {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return {
    platform: nav.userAgentData?.platform ?? nav.platform ?? undefined,
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
  };
};
