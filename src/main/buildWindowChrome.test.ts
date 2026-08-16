import { expect, it } from "vitest";
import { buildTitleBarOverlay } from "./buildTitleBarOverlay";
import { buildWindowChrome } from "./buildWindowChrome";

it("uses hiddenInset without an overlay on macOS", () => {
  const chrome = buildWindowChrome("darwin", false);
  expect(chrome.titleBarStyle).toBe("hiddenInset");
  expect(chrome.titleBarOverlay).toBeUndefined();
  expect(chrome.autoHideMenuBar).toBeUndefined();
});

it("uses hidden + titleBarOverlay + autoHideMenuBar on Windows", () => {
  const chrome = buildWindowChrome("win32", false);
  expect(chrome.titleBarStyle).toBe("hidden");
  expect(chrome.titleBarOverlay).toEqual(buildTitleBarOverlay(false));
  expect(chrome.autoHideMenuBar).toBe(true);
});

it("uses hidden + titleBarOverlay + autoHideMenuBar on Linux", () => {
  const chrome = buildWindowChrome("linux", true);
  expect(chrome.titleBarStyle).toBe("hidden");
  expect(chrome.titleBarOverlay).toEqual(buildTitleBarOverlay(true));
  expect(chrome.autoHideMenuBar).toBe(true);
});
