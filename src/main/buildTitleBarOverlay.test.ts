import { expect, it } from "vitest";
import {
  buildTitleBarOverlay,
  buildTitleBarOverlayColor,
  TITLE_BAR_OVERLAY_HEIGHT,
} from "./buildTitleBarOverlay";
import { buildWindowBackgroundColor } from "./buildWindowBackgroundColor";

it("uses the window background RGB with a zero alpha as the overlay color", () => {
  for (const dark of [false, true]) {
    const color = buildTitleBarOverlayColor(dark);
    // Eight hex digits with a zero alpha byte.
    expect(color).toMatch(/^#[0-9a-f]{6}00$/);
    expect(color.slice(0, 7)).toBe(buildWindowBackgroundColor(dark));
    expect(buildTitleBarOverlay(dark).color).toBe(color);
  }
});

it("switches the symbol color by theme while keeping the height fixed", () => {
  const light = buildTitleBarOverlay(false);
  const dark = buildTitleBarOverlay(true);
  expect(light.symbolColor).toBe("#0a0a0a");
  expect(dark.symbolColor).toBe("#fafafa");
  expect(light.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
  expect(dark.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
});
