import { expect, it } from "vitest";
import { isHalfStepInRange } from "./isHalfStepInRange";

it("accepts multiples of 0.5 inside the range", () => {
  expect(isHalfStepInRange("0", 0, 5)).toBe(true);
  expect(isHalfStepInRange("0.5", 0, 5)).toBe(true);
  expect(isHalfStepInRange("3", 0, 5)).toBe(true);
  expect(isHalfStepInRange("3.0", 0, 5)).toBe(true);
  expect(isHalfStepInRange(".5", 0, 5)).toBe(true);
  expect(isHalfStepInRange("5", 0, 5)).toBe(true);
});

it("rejects other fractions", () => {
  expect(isHalfStepInRange("2.4", 0, 5)).toBe(false);
  expect(isHalfStepInRange("0.25", 0, 5)).toBe(false);
});

it("rejects values outside the range", () => {
  expect(isHalfStepInRange("5.5", 0, 5)).toBe(false);
  expect(isHalfStepInRange("-0.5", 0, 5)).toBe(false);
});

it("rejects anything that is not a plain decimal number", () => {
  expect(isHalfStepInRange("", 0, 5)).toBe(false);
  expect(isHalfStepInRange("3,5", 0, 5)).toBe(false);
  expect(isHalfStepInRange("abc", 0, 5)).toBe(false);
  expect(isHalfStepInRange("1e0", 0, 5)).toBe(false);
});
