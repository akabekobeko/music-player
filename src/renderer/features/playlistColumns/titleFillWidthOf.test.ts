import { expect, it } from "vitest";
import { titleFillWidthOf } from "./titleFillWidthOf";

// 560px without the title.
const WIDTHS = {
  ordinal: 44,
  title: 280,
  artist: 200,
  album: 200,
  duration: 72,
  menu: 44,
};

it("is the container width minus the other columns", () => {
  expect(titleFillWidthOf(WIDTHS, 1000)).toBe(440);
  expect(titleFillWidthOf({ ...WIDTHS, title: 900 }, 1000)).toBe(440);
});

it("is zero or negative when the other columns fill the container", () => {
  expect(titleFillWidthOf(WIDTHS, 560)).toBe(0);
  expect(titleFillWidthOf(WIDTHS, 0)).toBe(-560);
});
