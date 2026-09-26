import { expect, it } from "vitest";
import { isDurationClose } from "./isDurationClose";

it("accepts a difference up to the tolerance", () => {
  expect(isDurationClose(262000, 267000)).toBe(true);
  expect(isDurationClose(262000, 257000)).toBe(true);
  expect(isDurationClose(262000, 267001)).toBe(false);
});

it("passes when either side is unknown", () => {
  expect(isDurationClose(0, 1)).toBe(true);
  expect(isDurationClose(262000, null)).toBe(true);
  expect(isDurationClose(262000, undefined)).toBe(true);
});
