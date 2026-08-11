import { expect, it } from "vitest";
import { clampResumeOffset } from "./clampResumeOffset";

it("clamps the resume offset below the buffer end", () => {
  expect(clampResumeOffset(300, 200)).toBeCloseTo(199.95);
  expect(clampResumeOffset(100, 200)).toBe(100);
  expect(clampResumeOffset(-5, 200)).toBe(0);
});

it("keeps the offset as-is while the duration is unknown", () => {
  expect(clampResumeOffset(42, 0)).toBe(42);
});
