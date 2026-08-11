import { expect, it } from "vitest";
import { clampVolume } from "./clampVolume";

it("clamps into [0, 1] and defaults non-finite to 1", () => {
  expect(clampVolume(1.2)).toBe(1);
  expect(clampVolume(-0.1)).toBe(0);
  expect(clampVolume(0.4)).toBe(0.4);
  expect(clampVolume(Number.NaN)).toBe(1);
});
