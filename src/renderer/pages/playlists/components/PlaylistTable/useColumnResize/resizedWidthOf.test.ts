import { expect, it } from "vitest";
import { resizedWidthOf } from "./resizedWidthOf";

it("adds the pointer travel to the start width", () => {
  expect(resizedWidthOf(200, 30, 48)).toBe(230);
  expect(resizedWidthOf(200, -50, 48)).toBe(150);
  expect(resizedWidthOf(200, 0, 48)).toBe(200);
});

it("stops at the lower bound", () => {
  expect(resizedWidthOf(200, -152, 48)).toBe(48);
  expect(resizedWidthOf(200, -500, 48)).toBe(48);
});

it("stops the title at the bound the container gives it", () => {
  expect(resizedWidthOf(440, -100, 440)).toBe(440);
  expect(resizedWidthOf(440, 60, 440)).toBe(500);
});
