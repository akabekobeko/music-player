import { expect, it } from "vitest";
import { type BrowserInfo, detectOs } from "./detectOs";

const desktop = (
  platform: string | undefined,
  userAgent = "Mozilla/5.0",
): BrowserInfo => ({
  platform,
  userAgent,
  maxTouchPoints: 0,
});

it("maps desktop platform strings to an OS", () => {
  expect(detectOs(desktop("macOS"))).toBe("mac");
  expect(detectOs(desktop("MacIntel"))).toBe("mac");
  expect(detectOs(desktop("Windows"))).toBe("win");
  expect(detectOs(desktop("Win32"))).toBe("win");
  expect(detectOs(desktop("Linux"))).toBe("linux");
  expect(detectOs(desktop("Linux x86_64"))).toBe("linux");
});

it("returns undefined for phones, tablets and unknown platforms", () => {
  expect(detectOs(desktop(undefined))).toBeUndefined();
  expect(detectOs(desktop(""))).toBeUndefined();
  expect(
    detectOs(
      desktop(
        "iPhone",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      ),
    ),
  ).toBeUndefined();
  // Chrome for Android
  expect(
    detectOs(desktop("Linux armv8l", "Mozilla/5.0 (Linux; Android 14) Mobile")),
  ).toBeUndefined();
  // Firefox for Android has no "Mobile" token on tablets and no userAgentData
  expect(
    detectOs(desktop("Linux aarch64", "Mozilla/5.0 (Android 14; Tablet)")),
  ).toBeUndefined();
  expect(detectOs(desktop("Linux armv8l"))).toBeUndefined();
  // iPadOS Safari requesting the desktop site
  expect(
    detectOs({
      platform: "MacIntel",
      userAgent: "Mozilla/5.0 (Macintosh)",
      maxTouchPoints: 5,
    }),
  ).toBeUndefined();
});
