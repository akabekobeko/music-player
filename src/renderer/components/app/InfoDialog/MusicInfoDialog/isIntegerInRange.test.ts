import { expect, it } from "vitest";
import { isIntegerInRange } from "./isIntegerInRange";

it("accepts integers inside the range, bounds included", () => {
  expect(isIntegerInRange("1", 1, 9999)).toBe(true);
  expect(isIntegerInRange("2001", 1, 9999)).toBe(true);
  expect(isIntegerInRange("9999", 1, 9999)).toBe(true);
  expect(isIntegerInRange("0", 0, 9999)).toBe(true);
});

it("rejects values outside the range", () => {
  expect(isIntegerInRange("0", 1, 9999)).toBe(false);
  expect(isIntegerInRange("10000", 1, 9999)).toBe(false);
  expect(isIntegerInRange("-1", 0, 9999)).toBe(false);
});

it("rejects anything that is not a plain decimal integer", () => {
  expect(isIntegerInRange("", 0, 9)).toBe(false);
  expect(isIntegerInRange(" 5", 0, 9)).toBe(false);
  expect(isIntegerInRange("5.0", 0, 9)).toBe(false);
  expect(isIntegerInRange("1e3", 0, 9999)).toBe(false);
  expect(isIntegerInRange("0x10", 0, 9999)).toBe(false);
  expect(isIntegerInRange("abc", 0, 9)).toBe(false);
});
