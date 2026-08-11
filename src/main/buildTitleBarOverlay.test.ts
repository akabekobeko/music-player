import { expect, it } from "vitest";
import {
  buildTitleBarOverlay,
  TITLE_BAR_OVERLAY_HEIGHT,
} from "./buildTitleBarOverlay";

it("switches overlay colors by theme while keeping the height fixed", () => {
  const light = buildTitleBarOverlay(false);
  const dark = buildTitleBarOverlay(true);
  expect(light.color).not.toBe(dark.color);
  expect(light.symbolColor).not.toBe(dark.symbolColor);
  expect(light.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
  expect(dark.height).toBe(TITLE_BAR_OVERLAY_HEIGHT);
});
