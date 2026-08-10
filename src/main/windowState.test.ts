import { expect, it } from "vitest";
import { resolveWindowBounds } from "./windowState";

const PRIMARY = { x: 0, y: 0, width: 1920, height: 1080 };
const SECONDARY = { x: 1920, y: 0, width: 1280, height: 1024 };

const saved = (x?: number, y?: number) => ({
  x,
  y,
  width: 900,
  height: 670,
  maximized: false,
});

it("keeps a position that is visible on a display", () => {
  expect(resolveWindowBounds(saved(100, 100), [PRIMARY])).toEqual({
    x: 100,
    y: 100,
    width: 900,
    height: 670,
  });
});

it("keeps a position on a secondary display", () => {
  expect(resolveWindowBounds(saved(2000, 50), [PRIMARY, SECONDARY])).toEqual({
    x: 2000,
    y: 50,
    width: 900,
    height: 670,
  });
});

it("drops a position stranded off-screen (display unplugged)", () => {
  expect(resolveWindowBounds(saved(2000, 50), [PRIMARY])).toEqual({
    width: 900,
    height: 670,
  });
});

it("drops a position with only a sliver visible", () => {
  // 40px of the window on-screen — less than the 64px usability minimum.
  expect(resolveWindowBounds(saved(-860, 100), [PRIMARY])).toEqual({
    width: 900,
    height: 670,
  });
});

it("omits the position on first launch (unset x / y)", () => {
  expect(resolveWindowBounds(saved(), [PRIMARY])).toEqual({
    width: 900,
    height: 670,
  });
});
