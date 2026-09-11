import { expect, it } from "vitest";
import {
  buildTitleBarOverlay,
  TITLE_BAR_OVERLAY_COLOR,
  TITLE_BAR_OVERLAY_HEIGHT,
} from "./buildTitleBarOverlay";

it("keeps the overlay background transparent on both themes", () => {
  expect(buildTitleBarOverlay(false).color).toBe(TITLE_BAR_OVERLAY_COLOR);
  expect(buildTitleBarOverlay(true).color).toBe(TITLE_BAR_OVERLAY_COLOR);
  // Eight hex digits with a zero alpha byte.
  expect(TITLE_BAR_OVERLAY_COLOR).toMatch(/^#[0-9a-f]{6}00$/);
});

it("switches the symbol color by theme while keeping the height fixed", () => {
  const light = buildTitleBarOverlay(false);
  const dark = buildTitleBarOverlay(true);
  expect(light.symbolColor).toBe("#0a0a0a");
  expect(dark.symbolColor).toBe("#fafafa");
  expect(light.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
  expect(dark.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
});
