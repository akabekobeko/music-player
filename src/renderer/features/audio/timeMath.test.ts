import { expect, it } from "vitest";
import {
  type BufferedRanges,
  clampResumeOffset,
  clampVolume,
  isTimeBuffered,
} from "./timeMath";

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

it("clamps the resume offset below the buffer end", () => {
  expect(clampResumeOffset(300, 200)).toBeCloseTo(199.95);
  expect(clampResumeOffset(100, 200)).toBe(100);
  expect(clampResumeOffset(-5, 200)).toBe(0);
});

it("keeps the offset as-is while the duration is unknown", () => {
  expect(clampResumeOffset(42, 0)).toBe(42);
});

it("clampVolume clamps into [0, 1] and defaults non-finite to 1", () => {
  expect(clampVolume(1.2)).toBe(1);
  expect(clampVolume(-0.1)).toBe(0);
  expect(clampVolume(0.4)).toBe(0.4);
  expect(clampVolume(Number.NaN)).toBe(1);
});
