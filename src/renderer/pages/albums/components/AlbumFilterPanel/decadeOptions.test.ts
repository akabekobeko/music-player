import { expect, it } from "vitest";
import { decadeOptions } from "./decadeOptions";

it("builds ascending decades covering the year range", () => {
  expect(decadeOptions({ min: 1987, max: 2013 })).toEqual([
    1980, 1990, 2000, 2010,
  ]);
});

it("collapses a single-decade range to one entry", () => {
  expect(decadeOptions({ min: 1994, max: 1999 })).toEqual([1990]);
});

it("returns no decades when the library has no years", () => {
  expect(decadeOptions(null)).toEqual([]);
});
