import { expect, it } from "vitest";
import { type BufferedRanges, isTimeBuffered } from "./isTimeBuffered";

const ranges = (...pairs: Array<[number, number]>): BufferedRanges => ({
  length: pairs.length,
  start: (index) => pairs[index]?.[0] ?? 0,
  end: (index) => pairs[index]?.[1] ?? 0,
});

it("accepts a time inside a buffered range", () => {
  expect(isTimeBuffered(ranges([0, 30]), 10)).toBe(true);
});

it("rejects a time outside every range", () => {
  expect(isTimeBuffered(ranges([0, 30]), 60)).toBe(false);
  expect(isTimeBuffered(ranges(), 0)).toBe(false);
});

it("rejects a time in the still-loading tail of a range (end slack)", () => {
  expect(isTimeBuffered(ranges([0, 30]), 29.9)).toBe(false);
  expect(isTimeBuffered(ranges([0, 30]), 29.7)).toBe(true);
});

it("checks every range, not only the first", () => {
  expect(isTimeBuffered(ranges([0, 10], [50, 80]), 60)).toBe(true);
});
