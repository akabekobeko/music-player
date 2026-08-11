import { expect, it } from "vitest";
import { buildTitleBarOverlay } from "./buildTitleBarOverlay";
import { buildWindowChrome } from "./buildWindowChrome";

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
