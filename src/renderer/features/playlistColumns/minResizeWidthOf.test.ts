import { expect, it } from "vitest";
import { MIN_COLUMN_WIDTH } from "./constants";
import { minResizeWidthOf } from "./minResizeWidthOf";

// 560px without the title.
const WIDTHS = {
  ordinal: 44,
  title: 440,
  artist: 200,
  album: 200,
  duration: 72,
  menu: 44,
};

it("stops every column but the title at the minimum width", () => {
  expect(minResizeWidthOf("artist", WIDTHS, 1000)).toBe(MIN_COLUMN_WIDTH);
  expect(minResizeWidthOf("duration", WIDTHS, 1000)).toBe(MIN_COLUMN_WIDTH);
});

it("stops the title at the space the other columns leave", () => {
  expect(minResizeWidthOf("title", WIDTHS, 1000)).toBe(440);
});

it("stops the title at the minimum width when the columns overflow", () => {
  expect(minResizeWidthOf("title", WIDTHS, 500)).toBe(MIN_COLUMN_WIDTH);
  expect(minResizeWidthOf("title", WIDTHS, 0)).toBe(MIN_COLUMN_WIDTH);
});
