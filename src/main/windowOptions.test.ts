import { expect, it } from "vitest";
import {
  buildTitleBarOverlay,
  buildWindowChrome,
  TITLE_BAR_OVERLAY_HEIGHT,
} from "./windowOptions";

it("uses hiddenInset without an overlay on macOS", () => {
  const chrome = buildWindowChrome("darwin", false);
  expect(chrome.titleBarStyle).toBe("hiddenInset");
  expect(chrome.titleBarOverlay).toBeUndefined();
});

it("uses hidden + titleBarOverlay on Windows", () => {
  const chrome = buildWindowChrome("win32", false);
  expect(chrome.titleBarStyle).toBe("hidden");
  expect(chrome.titleBarOverlay).toEqual(buildTitleBarOverlay(false));
});

it("uses hidden + titleBarOverlay on Linux", () => {
  const chrome = buildWindowChrome("linux", true);
  expect(chrome.titleBarStyle).toBe("hidden");
  expect(chrome.titleBarOverlay).toEqual(buildTitleBarOverlay(true));
});

it("switches overlay colors by theme while keeping the height fixed", () => {
  const light = buildTitleBarOverlay(false);
  const dark = buildTitleBarOverlay(true);
  expect(light.color).not.toBe(dark.color);
  expect(light.symbolColor).not.toBe(dark.symbolColor);
  expect(light.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
  expect(dark.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
});
