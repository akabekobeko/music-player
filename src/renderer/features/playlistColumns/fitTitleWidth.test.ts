import { expect, it } from "vitest";
import { fitTitleWidth } from "./fitTitleWidth";

// 840px in total, 560px without the title.
const WIDTHS = {
  ordinal: 44,
  title: 280,
  artist: 200,
  album: 200,
  duration: 72,
  menu: 44,
};

it("widens the title to fill a container wider than the columns", () => {
  expect(fitTitleWidth(WIDTHS, 1000)).toEqual({ ...WIDTHS, title: 440 });
});

it("keeps the widths when the columns are wider than the container", () => {
  expect(fitTitleWidth(WIDTHS, 600)).toBe(WIDTHS);
});

it("keeps the widths when the columns fill the container exactly", () => {
  expect(fitTitleWidth(WIDTHS, 840)).toBe(WIDTHS);
});

it("keeps the widths before the container is measured", () => {
  expect(fitTitleWidth(WIDTHS, 0)).toBe(WIDTHS);
});

it("leaves the other columns untouched", () => {
  const fitted = fitTitleWidth(WIDTHS, 2000);
  expect({ ...fitted, title: WIDTHS.title }).toEqual(WIDTHS);
});
