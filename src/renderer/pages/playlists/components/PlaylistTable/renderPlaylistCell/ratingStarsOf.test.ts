import { expect, it } from "vitest";
import { ratingStarsOf } from "./ratingStarsOf";

it("maps the normalised rating to the 5-star scale", () => {
  expect(ratingStarsOf(0)).toBe(0);
  expect(ratingStarsOf(0.5)).toBe(2.5);
  expect(ratingStarsOf(0.7)).toBe(3.5);
  expect(ratingStarsOf(1)).toBe(5);
});

it("rounds to the nearest half star", () => {
  expect(ratingStarsOf(0.64)).toBe(3);
  expect(ratingStarsOf(0.66)).toBe(3.5);
});

it("keeps out-of-range values within the scale", () => {
  expect(ratingStarsOf(-0.2)).toBe(0);
  expect(ratingStarsOf(1.4)).toBe(5);
});
